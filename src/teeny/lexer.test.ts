// sum.test.js
import { describe, expect, test } from "vitest";
import { Lexer } from "./lexer.ts";

describe("Lexer", () => {
  test("operators", () => {
    const tokens = new Lexer("+ - * /").tokenize();
    expect(tokens).toEqual([
      {
        kind: "PLUS",
        line: 1,
        text: "+",
      },
      {
        kind: "MINUS",
        line: 1,
        text: "-",
      },
      {
        kind: "ASTERISK",
        line: 1,
        text: "*",
      },
      {
        kind: "SLASH",
        line: 1,
        text: "/",
      },
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 2,
        text: "EOF",
      },
    ]);
  });

  test("string token", () => {
    const tokens = new Lexer('"Test String"').tokenize();
    expect(tokens).toEqual([
      {
        kind: "STRING",
        line: 1,
        text: "Test String",
        value: "Test String",
      },
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 2,
        text: "EOF",
      },
    ]);
  });

  test("newline and EOF", () => {
    const tokens = new Lexer("\n").tokenize();
    expect(tokens).toEqual([
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "NEWLINE",
        line: 2,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 3,
        text: "EOF",
      },
    ]);
  });

  test("double equals operator", () => {
    const tokens = new Lexer("==").tokenize();
    expect(tokens).toEqual([
      {
        kind: "EQEQ",
        line: 1,
        text: "==",
      },
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 2,
        text: "EOF",
      },
    ]);
  });

  test("greater-than and less-than operators", () => {
    const tokens = new Lexer("<>").tokenize();
    expect(tokens).toEqual([
      {
        kind: "LT",
        line: 1,
        text: "<",
      },
      {
        kind: "GT",
        line: 1,
        text: ">",
      },
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 2,
        text: "EOF",
      },
    ]);
  });

  test("comments", () => {
    const tokens = new Lexer("# This is a comment\n+").tokenize();
    expect(tokens).toEqual([
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "PLUS",
        line: 2,
        text: "+",
      },
      {
        kind: "NEWLINE",
        line: 2,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 3,
        text: "EOF",
      },
    ]);
  });

  test("numbers", () => {
    const tokens = new Lexer("+-123 9.8654*/").tokenize();
    expect(tokens).toEqual([
      {
        kind: "PLUS",
        line: 1,
        text: "+",
      },
      {
        kind: "MINUS",
        line: 1,
        text: "-",
      },
      {
        kind: "NUMBER",
        line: 1,
        text: "123",
        value: 123,
      },
      {
        kind: "NUMBER",
        line: 1,
        text: "9.8654",
        value: 9.8654,
      },
      {
        kind: "ASTERISK",
        line: 1,
        text: "*",
      },
      {
        kind: "SLASH",
        line: 1,
        text: "/",
      },
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 2,
        text: "EOF",
      },
    ]);
  });

  test("keywords and identifiers", () => {
    const tokens = new Lexer("F+-123 foo*THEN/").tokenize();
    expect(tokens).toEqual([
      {
        kind: "IDENTIFIER",
        line: 1,
        text: "F",
        value: "F",
      },
      {
        kind: "PLUS",
        line: 1,
        text: "+",
      },
      {
        kind: "MINUS",
        line: 1,
        text: "-",
      },
      {
        kind: "NUMBER",
        line: 1,
        text: "123",
        value: 123,
      },
      {
        kind: "IDENTIFIER",
        line: 1,
        text: "foo",
        value: "foo",
      },
      {
        kind: "ASTERISK",
        line: 1,
        text: "*",
      },
      {
        kind: "THEN",
        line: 1,
        text: "THEN",
      },
      {
        kind: "SLASH",
        line: 1,
        text: "/",
      },
      {
        kind: "NEWLINE",
        line: 1,
        text: "NEWLINE",
      },
      {
        kind: "EOF",
        line: 2,
        text: "EOF",
      },
    ]);
  });
});
