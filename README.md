# Teeny Tiny Interpreter

This small interpreter is based on the project [Teeny Tiny Compiler](https://github.com/AZHenley/teenytinycompiler) 
by [Austin Z. Henley](https://austinhenley.com). 
Please read his excellent tutorial [Let's make a Teeny Tiny compiler, part 1](https://austinhenley.com/blog/teenytinycompiler1.html) 
as well as [Part 2](https://austinhenley.com/blog/teenytinycompiler2.html) 
and [Part 3](https://austinhenley.com/blog/teenytinycompiler3.html).

Here is an implementation of the compiler (`./src/teeny/parserCompiler.ts`), 
which is based on the tutorial and will transpile the Teeny code to C.

The interpreter is an adaption of the tutorial (`./src/teeny/parserInterpreter.ts`) 
and will execute the Teeny Tiny code directly. It is written in TypeScript and can run in the browser 
or via [Bun](https://bun.sh), which can execute the TypeScript code directly.


```bash
bun run src/teeny/interpreterScript.ts teeny/hello.teeny 
```

or run the compiler

```bash
bun run src/teeny/compilerScript.ts teeny/hello.teeny 
```

## Web version

The web version is a simple Vue.js app. It can be started with:

```bash
# install dependencies
npm install

# run dev server
npm run dev
```