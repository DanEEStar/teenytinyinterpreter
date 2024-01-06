import { CodeEmitter } from "./emitter.ts";
import type { TokenType, TokenTypeKind } from "./lexer.ts";
import { Lexer } from "./lexer.ts";

function isIdentifier(
  token: TokenType | undefined,
): token is TokenType & { kind: "IDENTIFIER" } {
  return Boolean(token && token.kind === "IDENTIFIER");
}

export class ParserCompiler {
  currentToken: TokenType | undefined = undefined;
  peekToken: TokenType | undefined = undefined;
  symbols: Set<string> = new Set();
  labelsDeclared: Set<string> = new Set();
  labelsGotoed: Set<string> = new Set();

  constructor(
    private lexer: Lexer,
    private emitter: CodeEmitter,
  ) {
    this.nextToken();
    this.nextToken();
  }

  checkToken(kind: TokenTypeKind) {
    return this.currentToken?.kind === kind;
  }

  checkPeek(kind: TokenTypeKind) {
    return this.peekToken?.kind === kind;
  }

  nextToken() {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.getToken();
  }

  match(kind: TokenTypeKind) {
    if (!this.checkToken(kind)) {
      this.abort(
        `Expected ${kind}, got ${this.currentToken?.kind}, line ${this.currentToken?.line}`,
      );
    }
    this.nextToken();
  }

  abort(message: string) {
    console.error(`${message}`);
    throw new Error(`${message}`);
  }

  program() {
    this.emitter.headerLine("#include <stdio.h>");
    this.emitter.headerLine("int main() {");

    while (this.currentToken?.kind === "NEWLINE") {
      this.nextToken();
    }

    while (this.currentToken?.kind !== "EOF") {
      this.statement();
    }

    // wrap up
    this.emitter.emitLine("return 0;");
    this.emitter.emitLine("}");

    // check that each label referenced in a GOTO is declared
    for (const label of this.labelsGotoed) {
      if (!this.labelsDeclared.has(label)) {
        this.abort(
          `Attempting to GOTO to undeclared label "${label}", line ${this.currentToken?.line}`,
        );
      }
    }
  }

  statement() {
    if (this.checkToken("PRINT")) {
      this.nextToken();

      if (this.currentToken?.kind === "STRING") {
        this.emitter.emitLine(`printf("${this.currentToken?.value}\\n");`);
        this.nextToken();
      } else {
        this.emitter.emit(`printf("%.2f\\n", (float)(`);
        this.expression();
        this.emitter.emitLine("));");
      }
    } else if (this.checkToken("IF")) {
      this.nextToken();
      this.emitter.emit("if (");
      this.comparison();

      this.match("THEN");
      this.newline();
      this.emitter.emitLine(") {");

      while (!this.checkToken("ENDIF")) {
        this.statement();
      }
      this.match("ENDIF");
      this.emitter.emitLine("}");
    } else if (this.checkToken("WHILE")) {
      this.nextToken();
      this.emitter.emit("while (");
      this.comparison();

      this.match("REPEAT");
      this.newline();
      this.emitter.emitLine(") {");

      while (!this.checkToken("ENDWHILE")) {
        this.statement();
      }
      this.match("ENDWHILE");
      this.emitter.emitLine("}");
    } else if (this.checkToken("LABEL")) {
      this.nextToken();

      // make sure this label doesn't already exist
      if (isIdentifier(this.currentToken)) {
        const label = this.currentToken?.value;
        if (this.labelsDeclared.has(label)) {
          this.abort(`Label ${label} already exists`);
        } else {
          this.labelsDeclared.add(label);
          this.emitter.emitLine(`${label}:`);
        }
      }
      this.match("IDENTIFIER");
    } else if (this.checkToken("GOTO")) {
      this.nextToken();

      if (isIdentifier(this.currentToken)) {
        const label = this.currentToken?.value;
        this.labelsGotoed.add(label);
        this.emitter.emitLine(`goto ${label};`);
      }

      this.match("IDENTIFIER");
    } else if (this.checkToken("LET")) {
      this.nextToken();

      // check if variable has already been declared
      if (isIdentifier(this.currentToken)) {
        const name = this.currentToken?.value;
        if (!this.symbols.has(name)) {
          this.symbols.add(name);
          this.emitter.headerLine(`float ${name};`);
        }
        this.emitter.emit(`${name} = `);
      }

      this.match("IDENTIFIER");
      this.match("EQ");
      this.expression();
      this.emitter.emitLine(";");
    } else if (this.checkToken("INPUT")) {
      this.nextToken();

      if (isIdentifier(this.currentToken)) {
        const name = this.currentToken?.value;
        if (!this.symbols.has(name)) {
          this.symbols.add(name);
          this.emitter.headerLine(`float ${name};`);
        }

        this.emitter.emitLine(`if(0 == scanf("%f", &${name})) {`);
        this.emitter.emitLine(`${name} = 0;`);
        this.emitter.emitLine('scanf("%*s");');
        this.emitter.emitLine("}");
      }

      this.match("IDENTIFIER");
    } else {
      this.abort(
        `Invalid statement at ${this.currentToken?.text} line ${this.currentToken?.line} (${this.currentToken?.kind})`,
      );
    }

    this.newline();
  }

  comparison() {
    this.expression();

    if (this.isComparisonOperator()) {
      this.emitter.emit(this.currentToken?.text ?? "");
      this.nextToken();
      this.expression();
    } else {
      this.abort(
        `Expected comparison operator at ${this.currentToken?.text} line ${this.currentToken?.line} (${this.currentToken?.kind})`,
      );
    }

    while (this.isComparisonOperator()) {
      this.emitter.emit(this.currentToken?.text ?? "");
      this.nextToken();
      this.expression();
    }
  }

  isComparisonOperator() {
    return (
      this.checkToken("EQEQ") ||
      this.checkToken("NOTEQ") ||
      this.checkToken("LT") ||
      this.checkToken("LTEQ") ||
      this.checkToken("GT") ||
      this.checkToken("GTEQ")
    );
  }

  expression() {
    this.term();

    while (this.checkToken("PLUS") || this.checkToken("MINUS")) {
      this.emitter.emit(this.currentToken?.text ?? "");
      this.nextToken();
      this.term();
    }
  }

  term() {
    this.unary();

    while (this.checkToken("ASTERISK") || this.checkToken("SLASH")) {
      this.emitter.emit(this.currentToken?.text ?? "");
      this.nextToken();
      this.unary();
    }
  }

  unary() {
    if (this.checkToken("MINUS") || this.checkToken("PLUS")) {
      this.emitter.emit(this.currentToken?.text ?? "");
      this.nextToken();
    }

    this.primary();
  }

  primary() {
    if (this.currentToken?.kind === "NUMBER") {
      this.emitter.emit(this.currentToken.value.toString() ?? "");
      this.nextToken();
    } else if (isIdentifier(this.currentToken)) {
      if (!this.symbols.has(this.currentToken.value)) {
        this.abort(
          `Referencing variable before assignment: "${this.currentToken.value}", line ${this.currentToken.line}`,
        );
      }
      this.emitter.emit(this.currentToken.value);
      this.nextToken();
    } else {
      this.abort(
        `Unexpected token at ${this.currentToken?.text} line ${this.currentToken?.line} (${this.currentToken?.kind})`,
      );
    }
  }

  newline() {
    this.match("NEWLINE");

    while (this.checkToken("NEWLINE")) {
      this.nextToken();
    }
  }
}
