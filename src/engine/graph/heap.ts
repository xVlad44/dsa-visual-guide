/**
 * Binary min-heap keyed by (priority, insertion order). The insertion counter
 * breaks ties, so extraction order is deterministic for equal priorities.
 */
export class MinHeap<T> {
  private items: Array<{ priority: number; seq: number; value: T }> = [];
  private seq = 0;

  get size(): number {
    return this.items.length;
  }

  push(priority: number, value: T): void {
    this.items.push({ priority, seq: this.seq++, value });
    this.up(this.items.length - 1);
  }

  pop(): { priority: number; value: T } | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      this.down(0);
    }
    return { priority: top.priority, value: top.value };
  }

  private less(a: number, b: number): boolean {
    const x = this.items[a];
    const y = this.items[b];
    return x.priority < y.priority || (x.priority === y.priority && x.seq < y.seq);
  }

  private up(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(i, p)) break;
      [this.items[i], this.items[p]] = [this.items[p], this.items[i]];
      i = p;
    }
  }

  private down(i: number): void {
    const n = this.items.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.less(l, m)) m = l;
      if (r < n && this.less(r, m)) m = r;
      if (m === i) return;
      [this.items[i], this.items[m]] = [this.items[m], this.items[i]];
      i = m;
    }
  }
}
