<script setup lang="ts">
import { ref } from "vue";
import { readFileSync } from "node:fs";
import { Lexer } from "@/teeny/lexer.ts";
import { ParserInterpreter } from "@/teeny/parserInterpreter.ts";

const sourceCode = ref("");
const programOutput = ref("");

const runCode = async () => {
  const data = sourceCode.value;
  const lexer = new Lexer(data);
  const parser = new ParserInterpreter(lexer.tokenize());
  await parser.program();
};
</script>

<template>
  <main class="container">
    <h1>Hello world</h1>
    <div class="row">
      <div class="col">
        <h3>Source Code</h3>
        <div id="editor">
          <textarea id="editor-textarea" rows="20" v-model="sourceCode"></textarea>
        </div>
        <div><button class="button" @click="runCode()">Run code</button></div>
      </div>
      <div class="col">
        <h3>Output</h3>
        <pre>{{ programOutput }}</pre>
      </div>
    </div>
  </main>
</template>

<style scoped>
#editor-textarea {
  font-family: monospace;
  font-size: 16px;
}
</style>
