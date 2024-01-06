export class CodeEmitter {
  code: string = "";
  header: string = "";

  emit(code: string) {
    this.code += code;
  }

  emitLine(code: string) {
    this.code += code + "\n";
  }

  headerLine(code: string) {
    this.header += code + "\n";
  }

  createCode(): string {
    return this.header + this.code;
  }
}
