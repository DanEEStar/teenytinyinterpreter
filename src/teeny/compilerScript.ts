import { readFileSync, writeFileSync } from "node:fs";

import { CodeEmitter } from "./emitter.ts";
import { Lexer } from "./lexer.ts";
import { ParserCompiler } from "./parserCompiler.ts";

function main() {
  console.log("Teeny Tiny Compiler");

  if (process.argv.length !== 3) {
    console.error("Error: Compiler needs source file as argument.");
    process.exit(1);
  }

  try {
    const data = readFileSync(process.argv[2], "utf8");
    const lexer = new Lexer(data);
    const emitter = new CodeEmitter();
    const parser = new ParserCompiler(lexer, emitter);
    parser.program();

    console.log("Parsing completed.");
    console.log(emitter.createCode());
    writeFileSync("out/out.c", emitter.createCode());
    console.log("Wrote output to out/out.c");
  } catch (err) {
    console.error(`Error: Could not read file ${process.argv[2]}`);
    console.error(err);
  }
}

main();
