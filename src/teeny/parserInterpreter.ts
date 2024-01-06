import { TokenType, TokenTypeKind } from "./lexer.ts";

function isIdentifier(
  token: TokenType | undefined,
): token is TokenType & { kind: "IDENTIFIER" } {
  return Boolean(token && token.kind === "IDENTIFIER");
}

export class ParserInterpreter {
  currentTokenIndex: number = 0;
  tokens: TokenType[] = [];
  symbols: Map<string, number> = new Map();
  labelsDeclared: Map<string, number> = new Map();
  labelsGotoed: Set<string> = new Set();

  constructor(tokens: TokenType[]) {
    this.tokens = tokens;
  }

  getCurrentToken() {
    return this.tokens[this.currentTokenIndex];
  }

  getPeekToken() {
    return this.tokens[this.currentTokenIndex + 1];
  }

  checkToken(kind: TokenTypeKind) {
    return this.tokens[this.currentTokenIndex]?.kind === kind;
  }

  nextToken() {
    this.currentTokenIndex += 1;
  }

  match(kind: TokenTypeKind) {
    if (!this.checkToken(kind)) {
      this.abort(
        `Expected ${kind}, got ${this.getCurrentToken().kind}, line ${
          this.getCurrentToken().line
        }`,
      );
    }
    this.nextToken();
  }

  abort(message: string) {
    console.error(`${message}`);
    this.currentTokenIndex = this.tokens.length;
    throw new Error(`${message}`);
  }

  async program() {
    while (this.getCurrentToken().kind === "NEWLINE") {
      this.nextToken();
    }

    while (this.getCurrentToken().kind !== "EOF") {
      await this.statement();
    }

    // check that each label referenced in a GOTO is declared
    for (const label of this.labelsGotoed) {
      if (!this.labelsDeclared.has(label)) {
        this.abort(
          `Attempting to GOTO to undeclared label "${label}", line ${
            this.getCurrentToken().line
          }`,
        );
      }
    }
  }

  async statement() {
    if (this.checkToken("PRINT")) {
      this.nextToken();
      const currentToken = this.getCurrentToken();

      if (currentToken.kind === "STRING") {
        console.log(currentToken.value);
        this.nextToken();
      } else {
        const value = this.expression();
        console.log(value);
        this.nextToken();
      }
    } else if (this.checkToken("IF")) {
      this.nextToken();
      const comparisonValue = this.comparison();
      this.nextToken();

      this.match("THEN");
      this.newline();

      while (!this.checkToken("ENDIF")) {
        if (comparisonValue) {
          if (this.checkToken("GOTO")) {
            // break cleanly out of if when we see a GOTO
            break;
          }
          await this.statement();
        } else {
          // just advance until we find an ENDIF
          this.nextToken();
        }
      }
      if (!this.checkToken("GOTO")) {
        this.match("ENDIF");
      }
    } else if (this.checkToken("WHILE")) {
      const whileTokenIndex = this.currentTokenIndex - 1;
      this.nextToken();
      const comparisonValue = this.comparison();
      this.nextToken();

      this.match("REPEAT");
      this.newline();

      while (!this.checkToken("ENDWHILE")) {
        if (comparisonValue) {
          await this.statement();
          if (this.checkToken("GOTO")) {
            // break cleanly out of if when we see a GOTO
            break;
          }
        } else {
          // just advance until we find an ENDWHILE
          this.nextToken();
        }
      }
      if (!this.checkToken("GOTO")) {
        this.match("ENDWHILE");
      }
      if (comparisonValue) {
        this.currentTokenIndex = whileTokenIndex;
      }
    } else if (this.checkToken("LABEL")) {
      const labelTokenIndex = this.currentTokenIndex - 1;
      this.nextToken();

      const currentToken = this.getCurrentToken();

      if (isIdentifier(currentToken)) {
        const label = currentToken.value;
        if (
          this.labelsDeclared.has(label) &&
          this.labelsDeclared.get(label) !== labelTokenIndex
        ) {
          // make sure this label doesn't already exist
          this.abort(`Label ${label} already exists`);
        } else {
          this.labelsDeclared.set(label, labelTokenIndex);
        }
      }
      this.match("IDENTIFIER");
    } else if (this.checkToken("LET")) {
      this.nextToken();

      const currentToken = this.getCurrentToken();
      if (isIdentifier(currentToken)) {
        const name = currentToken.value;
        // check if variable has already been declared
        if (!this.symbols.has(name)) {
          this.symbols.set(name, 0);
        }
        this.match("IDENTIFIER");
        this.match("EQ");
        const value = this.expression();
        this.symbols.set(name, value);
        this.nextToken();
      } else {
        this.abort(
          `Invalid identifier at ${currentToken.text} line ${currentToken.line} (${currentToken.kind})`,
        );
      }

      // this.emitter.emitLine(";");
    } else if (this.checkToken("INPUT")) {
      this.nextToken();
      const currentToken = this.getCurrentToken();

      if (isIdentifier(currentToken)) {
        let inputNumber = 0;
        if (typeof process === "object" && process.versions && process.versions.node) {
          let input = "";
          // read single number from node (or bun) console
          for await (input of console) {
            break;
          }
          const inputNumberMaybe = Number(input);
          if (isNaN(inputNumberMaybe)) {
            inputNumber = 0;
          } else {
            inputNumber = inputNumberMaybe;
          }
        } else {
          // in the browser, prompt for input
          const input = prompt(currentToken.value);
          const inputNumberMaybe = Number(input);
          if (isNaN(inputNumberMaybe)) {
            inputNumber = 0;
          } else {
            inputNumber = inputNumberMaybe;
          }
        }
        const name = currentToken.value;
        this.symbols.set(name, inputNumber);
      }

      this.match("IDENTIFIER");
    } else {
      const currentToken = this.getCurrentToken();
      this.abort(
        `Invalid statement at ${currentToken.text} line ${currentToken.line} (${currentToken.kind})`,
      );
      return;
    }

    if (this.checkToken("GOTO")) {
      this.nextToken();

      const currentToken = this.getCurrentToken();
      if (isIdentifier(currentToken)) {
        const label = currentToken.value;
        this.labelsGotoed.add(label);

        if (!this.labelsDeclared.has(label)) {
          this.abort(`Attempting to GOTO to undeclared label ${label}`);
        }
        this.match("IDENTIFIER");
        this.currentTokenIndex = this.labelsDeclared.get(label) ?? 0;
      } else {
        this.abort(
          `Expected identifier, got ${currentToken.kind}, line ${currentToken.line}`,
        );
      }
    }

    this.newline();
  }

  comparison(): boolean {
    const lValue = this.expression();
    this.nextToken();

    if (this.isComparisonOperator()) {
      const operator = this.getCurrentToken().kind;
      this.nextToken();
      const rValue = this.expression();
      if (operator === "EQ") {
        return lValue == rValue;
      } else if (operator === "NOTEQ") {
        return lValue != rValue;
      } else if (operator === "LT") {
        return lValue < rValue;
      } else if (operator === "LTEQ") {
        return lValue <= rValue;
      } else if (operator === "GT") {
        return lValue > rValue;
      } else if (operator === "GTEQ") {
        return lValue >= rValue;
      } else {
        const currentToken = this.getCurrentToken();
        this.abort(
          `Unknown operator at ${currentToken.text} line ${currentToken.line} (${currentToken.kind})`,
        );
        throw new Error("unreachable");
      }
    } else {
      const currentToken = this.getCurrentToken();
      this.abort(
        `Expected comparison operator at ${currentToken.text} line ${currentToken.line} (${currentToken.kind})`,
      );
      throw new Error("unreachable");
    }
    // only a single comparison operator is allowed
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

  expression(): number {
    const lValue = this.term();

    if (this.getPeekToken().kind === "PLUS") {
      this.nextToken();
      this.nextToken();
      return lValue + this.term();
    } else if (this.getPeekToken().kind === "MINUS") {
      this.nextToken();
      this.nextToken();
      return lValue - this.term();
    }

    return lValue;
  }

  term(): number {
    const lValue = this.unary();
    if (this.getPeekToken().kind === "ASTERISK") {
      this.nextToken();
      this.nextToken();
      return lValue * this.unary();
    } else if (this.getPeekToken().kind === "SLASH") {
      this.nextToken();
      this.nextToken();
      return lValue / this.unary();
    }
    return lValue;
  }

  unary(): number {
    if (this.checkToken("MINUS")) {
      this.nextToken();
      return -this.primary();
    } else if (this.checkToken("PLUS")) {
      this.nextToken();
      return this.primary();
    }

    return this.primary();
  }

  primary(): number {
    const currentToken = this.getCurrentToken();
    if (currentToken.kind === "NUMBER") {
      return currentToken.value;
    } else if (isIdentifier(currentToken)) {
      if (!this.symbols.has(currentToken.value)) {
        this.abort(
          `Referencing variable before assignment: "${currentToken.value}", line ${currentToken.line}`,
        );
      }
      return this.symbols.get(currentToken.value) ?? 0;
    } else {
      this.abort(
        `Unexpected token at ${currentToken?.text} line ${currentToken?.line} (${currentToken?.kind})`,
      );
      throw new Error("unreachable");
    }
  }

  newline() {
    this.match("NEWLINE");

    while (this.checkToken("NEWLINE")) {
      this.nextToken();
    }
  }
}
