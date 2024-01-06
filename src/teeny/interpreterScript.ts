import { readFileSync } from "node:fs";
import { Lexer } from "./lexer.ts";
import { ParserInterpreter } from "./parserInterpreter.ts";

async function main() {
  console.log("Teeny Tiny Interpreter");

  if (process.argv.length !== 3) {
    console.error("Error: Compiler needs source file as argument.");
    process.exit(1);
  }

  try {
    const data = readFileSync(process.argv[2], "utf8");
    const lexer = new Lexer(data);
    const parser = new ParserInterpreter(lexer.tokenize());
    await parser.program();

    console.log("Parsing completed.");
  } catch (err) {
    console.error(`Error: Could not read file ${process.argv[2]}`);
    console.error(err);
  }
}

await main();
