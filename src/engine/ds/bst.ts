/**
 * Unbalanced binary search tree as an immutable value. Equal values go right,
 * so an inorder walk yields the inserted values in sorted order.
 */

export interface BstNode {
  id: number;
  value: number;
  left: number | null;
  right: number | null;
}

export interface Bst {
  nodes: Record<number, BstNode>;
  root: number | null;
  nextId: number;
}

export const emptyBst = (): Bst => ({ nodes: {}, root: null, nextId: 1 });

/** Returns the new tree and the ids compared on the way down (for highlighting). */
export function bstInsert(tree: Bst, value: number): { tree: Bst; path: number[]; id: number } {
  const id = tree.nextId;
  const nodes: Record<number, BstNode> = { ...tree.nodes, [id]: { id, value, left: null, right: null } };
  if (tree.root === null) return { tree: { nodes, root: id, nextId: id + 1 }, path: [], id };

  const path: number[] = [];
  let cur = tree.root;
  for (;;) {
    path.push(cur);
    const node = nodes[cur];
    const side = value < node.value ? 'left' : 'right';
    const child = node[side];
    if (child === null) {
      nodes[cur] = { ...node, [side]: id };
      break;
    }
    cur = child;
  }
  return { tree: { nodes, root: tree.root, nextId: id + 1 }, path, id };
}

export type Traversal = 'inorder' | 'preorder' | 'postorder';

export function traverse(tree: Bst, order: Traversal): number[] {
  const out: number[] = [];
  const walk = (id: number | null) => {
    if (id === null) return;
    const n = tree.nodes[id];
    if (order === 'preorder') out.push(id);
    walk(n.left);
    if (order === 'inorder') out.push(id);
    walk(n.right);
    if (order === 'postorder') out.push(id);
  };
  walk(tree.root);
  return out;
}

export function height(tree: Bst): number {
  const h = (id: number | null): number => (id === null ? 0 : 1 + Math.max(h(tree.nodes[id].left), h(tree.nodes[id].right)));
  return h(tree.root);
}

/**
 * Tidy layout: x is the node's inorder rank, y its depth. Ranks are distinct,
 * so nodes never overlap however deep the tree grows.
 */
export function layoutBst(tree: Bst): Record<number, { rank: number; depth: number }> {
  const pos: Record<number, { rank: number; depth: number }> = {};
  let rank = 0;
  const walk = (id: number | null, depth: number) => {
    if (id === null) return;
    walk(tree.nodes[id].left, depth + 1);
    pos[id] = { rank: rank++, depth };
    walk(tree.nodes[id].right, depth + 1);
  };
  walk(tree.root, 0);
  return pos;
}
