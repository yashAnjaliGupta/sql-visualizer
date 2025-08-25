export class AliasResolver {
  private stack: Array<Map<string, string>> = [new Map()];

  pushScope() {
    this.stack.push(new Map());
  }

  popScope() {
    if (this.stack.length > 1) this.stack.pop();
  }

  register(alias: string | null | undefined, tableName: string | null | undefined) {
    if (!alias || !tableName) return;
    this.stack[this.stack.length - 1].set(alias, tableName);
  }

  resolve(name: string | null | undefined): string | undefined {
    if (!name) return undefined;
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const real = this.stack[i].get(name);
      if (real) return real;
    }
    return undefined;
  }
}
