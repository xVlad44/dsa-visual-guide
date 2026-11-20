export interface ParsedEdge {
  from: string;
  to: string;
  weight: number;
}

export interface ParseError {
  /** 1-based line number */
  line: number;
  message: string;
}

export interface ParsedGraph {
  /** node labels in order of first appearance */
  nodes: string[];
  edges: ParsedEdge[];
  errors: ParseError[];
}

const NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * Parses an edge list, one entry per line:
 *   `a b`      edge a–b with weight 1
 *   `a b 4`    edge a–b with weight 4
 *   `a`        isolated node
 * Blank lines and lines starting with `#` are ignored. A bad line is reported
 * and skipped; the rest of the list still parses.
 */
export function parseEdgeList(text: string): ParsedGraph {
  const nodes: string[] = [];
  const seen = new Set<string>();
  const edges: ParsedEdge[] = [];
  const errors: ParseError[] = [];
  const addNode = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      nodes.push(id);
    }
  };

  text.split('\n').forEach((raw, idx) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const parts = line.split(/\s+/);
    if (parts.length > 3) {
      errors.push({ line: idx + 1, message: 'expected "from to [weight]"' });
      return;
    }
    if (parts.length === 3 && !NUMBER.test(parts[2])) {
      errors.push({ line: idx + 1, message: `weight "${parts[2]}" is not a number` });
      return;
    }
    if (parts.length === 1) {
      addNode(parts[0]);
      return;
    }
    const [from, to] = parts;
    addNode(from);
    addNode(to);
    edges.push({ from, to, weight: parts.length === 3 ? Number(parts[2]) : 1 });
  });

  return { nodes, edges, errors };
}

/** Inverse of parseEdgeList (weights of 1 are omitted). */
export function formatEdgeList(edges: ParsedEdge[], isolated: string[]): string {
  const lines = edges.map(e => (e.weight === 1 ? `${e.from} ${e.to}` : `${e.from} ${e.to} ${e.weight}`));
  return [...lines, ...isolated].join('\n');
}
