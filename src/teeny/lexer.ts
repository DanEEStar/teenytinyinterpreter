const Keywords = [
  "LABEL",
  "GOTO",
  "PRINT",
  "INPUT",
  "LET",
  "IF",
  "THEN",
  "ENDIF",
  "WHILE",
  "REPEAT",
  "ENDWHILE",
] as const;

type Keyword = (typeof Keywords)[number];

const Operators = [
  "PLUS",
  "MINUS",
  "ASTERISK",
  "SLASH",
  "EQEQ",
  "NOTEQ",
  "LT",
  "LTEQ",
  "GT",
  "GTEQ",
  "EQ",
] as const;

type Operator = (typeof Operators)[number];

export type NonKeywordTokenType =
  | { kind: "EOF"; text: "EOF"; line: number }
  | { kind: "NEWLINE"; text: "NEWLINE"; line: number }
  | { kind: "NUMBER"; value: number; text: string; line: number }
  | { kind: "IDENTIFIER"; value: string; text: string; line: number }
  | { kind: "STRING"; value: string; text: string; line: number };

export type KeywordTokenType = { kind: Keyword; text: Keyword; line: number };
export type OperatorTokenType = { kind: Operator; text: string; line: number };

export type TokenType = NonKeywordTokenType | KeywordTokenType | OperatorTokenType;

export type TokenTypeKind = TokenType["kind"];

function createKeywordToken(kind: Keyword, line: number): KeywordTokenType {
  return { kind, text: kind, line };
}

function createOperatorToken(
  kind: Operator,
  text: string,
  line: number,
): OperatorTokenType {
  return { kind, text, line };
}

function isKeyword(str: string): str is Keyword {
  return (Keywords as readonly string[]).includes(str);
}

export function isInteger(str: string) {
  return /^\d+$/.test(str);
}

export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

export class Lexer {
  source: string = "\n";
  curChar: string = "";
  curPos: number = -1;
  curLine: number = 1;

  constructor(source: string) {
    this.source = source + "\n";
    this.nextChar();
  }

  nextChar(): void {
    this.curPos += 1;

    if (this.curChar === "\n") {
      this.curLine += 1;
    }

    if (this.curPos >= this.source.length) {
      this.curChar = "\0"; // EOF
    } else {
      this.curChar = this.source[this.curPos];
    }
  }

  peek(): string {
    if (this.curPos + 1 >= this.source.length) {
      return "\0";
    }
    return this.source[this.curPos + 1];
  }

  getToken(): TokenType | undefined {
    this.skipWhitespace();
    this.skipComment();

    let token: TokenType | undefined = undefined;
    if (this.curChar === "+") {
      token = createOperatorToken("PLUS", "+", this.curLine);
    } else if (this.curChar === "-") {
      token = createOperatorToken("MINUS", "-", this.curLine);
    } else if (this.curChar === "*") {
      token = createOperatorToken("ASTERISK", "*", this.curLine);
    } else if (this.curChar === "/") {
      token = createOperatorToken("SLASH", "/", this.curLine);
    } else if (this.curChar === "\n") {
      token = { kind: "NEWLINE", text: "NEWLINE", line: this.curLine };
    } else if (this.curChar === "\0") {
      token = { kind: "EOF", text: "EOF", line: this.curLine };
    } else if (this.curChar === "=") {
      if (this.peek() === "=") {
        this.nextChar();
        token = createOperatorToken("EQEQ", "==", this.curLine);
      } else {
        token = createOperatorToken("EQ", "=", this.curLine);
      }
    } else if (this.curChar === ">") {
      if (this.peek() === "=") {
        this.nextChar();
        token = createOperatorToken("GTEQ", ">=", this.curLine);
      } else {
        token = createOperatorToken("GT", ">", this.curLine);
      }
    } else if (this.curChar === "<") {
      if (this.peek() === "=") {
        this.nextChar();
        token = createOperatorToken("LTEQ", "<=", this.curLine);
      } else {
        token = createOperatorToken("LT", "<", this.curLine);
      }
    } else if (this.curChar === "!") {
      if (this.peek() === "=") {
        this.nextChar();
        token = createOperatorToken("NOTEQ", "!=", this.curLine);
      } else {
        this.abort(`Expected != got ! with ${this.peek()}`);
        return undefined;
      }
    } else if (this.curChar === '"') {
      this.nextChar();
      const startPos = this.curPos;
      while (this.curChar !== '"' && this.curChar !== "\0") {
        if (
          this.curChar === "\r" ||
          this.curChar === "\n" ||
          this.curChar === "\t" ||
          this.curChar === "%" ||
          this.curChar === "\\"
        ) {
          this.abort("Illegal chracater in string");
          return undefined;
        }
        this.nextChar();
      }

      // @ts-ignore
      if (this.curChar === "\0") {
        this.abort("Unclosed string literal");
        return undefined;
      }

      const tokText = this.source.substring(startPos, this.curPos);
      token = { kind: "STRING", value: tokText, text: tokText, line: this.curLine };
    } else if (isInteger(this.curChar)) {
      // Leading character is a digit, so this must be a number.
      // Get all consecutive digits and decimal if there is one.
      const startPos = this.curPos;
      while (isInteger(this.peek())) {
        this.nextChar();
      }
      if (this.peek() === ".") {
        this.nextChar();

        // Must have at least one digit after decimal.
        if (!isInteger(this.peek())) {
          this.abort("Illegal character in number");
          return undefined;
        }

        while (isInteger(this.peek())) {
          this.nextChar();
        }
      }
      const stringValue = this.source.substring(startPos, this.curPos + 1);
      token = {
        kind: "NUMBER",
        value: parseFloat(stringValue),
        text: stringValue,
        line: this.curLine,
      };
    } else if (isAlpha(this.curChar)) {
      // Leading character is a letter, so this must be an identifier or a keyword.
      // Get all consecutive alpha numeric characters.
      const startPos = this.curPos;
      while (isAlpha(this.peek())) {
        this.nextChar();
      }

      const tokText = this.source.substring(startPos, this.curPos + 1);

      if (isKeyword(tokText)) {
        token = createKeywordToken(tokText, this.curLine);
      } else {
        token = {
          kind: "IDENTIFIER",
          value: tokText,
          text: tokText,
          line: this.curLine,
        };
      }
    } else {
      this.abort(`Unknown token "${this.curChar}"`);
      return undefined;
    }

    this.nextChar();

    return token;
  }

  abort(message: string) {
    console.error(`Error at line ${this.curLine}: ${message}`);
    throw new Error(`Error at line ${this.curLine}: ${message}`);
  }

  skipWhitespace() {
    while ([" ", "\t", "\r"].includes(this.curChar)) {
      this.nextChar();
    }
  }

  skipComment() {
    if (this.curChar === "#") {
      // @ts-ignore
      while (this.curChar !== "\n") {
        this.nextChar();
      }
    }
  }

  tokenize(): TokenType[] {
    const tokens: TokenType[] = [];
    let token = this.getToken();
    while (token && token.kind !== "EOF") {
      tokens.push(token);
      token = this.getToken();
    }
    tokens.push({ kind: "EOF", text: "EOF", line: this.curLine });
    return tokens;
  }
}
