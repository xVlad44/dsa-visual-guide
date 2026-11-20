export interface Section {
  index: string;
  href: string;
  title: string;
  short: string;
  blurb: string;
}

export const SECTIONS: Section[] = [
  { index: '01', href: '/sorting', title: 'Sorting', short: 'Sorting', blurb: '8 algorithms' },
  { index: '02', href: '/graph', title: 'Graph traversal', short: 'Graphs', blurb: 'BFS · DFS · Dijkstra' },
  { index: '03', href: '/recursion', title: 'Recursion & backtracking', short: 'Backtracking', blurb: 'N-Queens · Sudoku · Hanoi' },
  { index: '04', href: '/data-structures', title: 'Data structures', short: 'Structures', blurb: 'Stack · Queue · List · BST' },
];
