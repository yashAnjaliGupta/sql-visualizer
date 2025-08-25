export function collectSetChain(root: any): { op: string | null; parts: any[] } {
  const parts: any[] = [];
  let cur: any = root;
  let op: string | null = null;
  while (cur) {
    const { _next, ...rest } = cur as any;
    parts.push(rest);
    if ((cur as any)._next && !op) {
      op = (cur as any)._next.set_op || 'union';
    }
    cur = (cur as any)._next;
  }
  return { op, parts };
}
