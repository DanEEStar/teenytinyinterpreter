<script setup lang="ts">
import { ref } from "vue";
import { Lexer } from "@/teeny/lexer.ts";
import { ParserInterpreter } from "@/teeny/parserInterpreter.ts";

const sourceCode = ref("");
const programOutput = ref("");
const programError = ref("");

const outputFn = (line: string) => {
  programOutput.value += line + "\n";
};

const errorFn = (line: string) => {
  programError.value += line + "\n";
};

const runCode = async () => {
  programOutput.value = "";
  programError.value = "";

  const data = sourceCode.value;
  const lexer = new Lexer(data);
  const parser = new ParserInterpreter(lexer.tokenize(), outputFn, errorFn);

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
        <div class="mt-4">
          <button class="pure-button" @click="runCode()">Run code</button>
        </div>
      </div>
      <div class="col">
        <div v-if="programError">
          <h3>Errors</h3>
          <pre class="error-lines">{{ programError }}</pre>
        </div>
        <h3>Output</h3>
        <pre v-if="programOutput">{{ programOutput }}</pre>
      </div>
    </div>
  </main>
</template>

<style scoped>
#editor-textarea {
  font-family: monospace;
  font-size: 16px;
  width: 100%;
  max-width: 100%;
}

.error-lines {
  color: darkred;
}
</style>
