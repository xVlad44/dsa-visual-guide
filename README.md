# DSA Visual Guide

Interactive visualisers for sorting, graph search, backtracking and basic data structures.

Live: [dsa.xvlad.dev](https://dsa.xvlad.dev) · Author: [xvlad.dev](https://xvlad.dev)

Each algorithm is a plain TypeScript function that records what it does, one typed event per operation. The UI never animates an algorithm itself. It replays the recorded trace, so every frame on screen is a step the algorithm actually took, and the same trace drives the counters, the pseudocode highlight and the scrubber.

## Modules

| Route | Contents |
| --- | --- |
| `/sorting` | Bubble, insertion, selection, merge, quick, heap, radix (LSD, base 10), bucket. Seeded inputs of 2 to 512 elements in five distributions, live counters next to the theoretical complexity, and an operations-vs-n chart produced by running the engine. |
| `/graph` | BFS, DFS and Dijkstra on a graph you type as an edge list or draw on the canvas, directed or undirected. Shows the queue, call stack or priority queue at every step. |
| `/recursion` | N-Queens (4 to 10, first solution or all), Sudoku (4×4, 6×6, 9×9) and Tower of Hanoi (2 to 10 disks). |
| `/data-structures` | Stack, queue, singly linked list, and an unbalanced BST with in/pre/post-order traversals. |

## Architecture

```
src/engine/      pure TypeScript: algorithms, traces, seeded inputs. No React, no DOM.
  sorting/       generators + SortTrace (checkpointed replay, prefix-summed counters)
  graph/         BFS / DFS / Dijkstra, binary heap, edge-list parser
  backtracking/  N-Queens, Sudoku, Hanoi
  ds/            immutable BST
  rng.ts         mulberry32 PRNG and input generators
src/player/      playback clock (pure), rAF player hook, keyboard shortcuts, URL state
src/components/  viz/ (stage, transport, pseudocode, bars, chart), layout/, page parts
src/pages/       one route each; every page except home is a lazy chunk
```

### Engine

Every algorithm is a generator. It works on its own copy of the input and yields an event for each operation it performs. For sorting, the events are:

```ts
type SortEvent =
  | { type: 'compare'; i: number; j: number; line: number }
  | { type: 'swap'; i: number; j: number; line: number }
  | { type: 'write'; i: number; value: number; from?: number; line: number }
  | { type: 'sorted'; i: number; line: number }
  | { type: 'done'; line: number }
  // also compareKey, compareAux, read, pivot, range
```

`line` points into that algorithm's pseudocode, which is how the pseudocode panel knows what to highlight. Graph and backtracking algorithms follow the same pattern with their own event types (push, pop, visit, relax; try, conflict, place, remove).

Inputs come from a seeded PRNG (mulberry32), so `?algo=quick&n=64&seed=123456&input=nearly-sorted` reproduces the same run on any machine. Every page keeps its state in the URL.

### Replay

A sorting trace can hold up to two million events. Storing a full array per event would cost O(n · events) memory, so `SortTrace`:

- keeps a state snapshot every 256 events and replays forward from the nearest one, so seeking to any step costs at most 256 event applications plus an O(n) copy;
- keeps a cursor, so stepping forward during playback is O(1) per event;
- stores comparisons, swaps, writes and reads as prefix sums in `Int32Array`s, so the counters for any step are O(1) lookups and exact.

Graph and backtracking traces are much shorter and are materialised as frames up front. Sudoku is the exception: a hard 9×9 can take millions of steps, so the recorder keeps the first 60,000 events for replay, still runs the search to the end, and shows the final board as the last frame.

### Player

`src/player/clock.ts` is a pure function: given the current index, a fractional carry, the elapsed milliseconds and the speed, it returns the next index. The `usePlayer` hook calls it from `requestAnimationFrame`. That makes playback independent of the frame rate, lets speeds above 60 steps per second advance several events per frame (1 to 512 steps/s), and caps any single frame gap at 250 ms, so returning to a backgrounded tab does not jump to the end.

Keyboard: Space or K play/pause, ←/→ or J/L step, Shift+arrow ±10, Home/End, R new seed (sorting). Shortcuts are ignored while focus is in a text field, slider or radio group.

### Rendering

Up to 100 bars render as DOM elements, which keeps value labels and CSS transitions. Above that, a canvas renderer draws the bars, scaled for the device pixel ratio and resized with a `ResizeObserver`; it reads its colours from the CSS custom properties so both themes stay correct. Graphs use React Flow with a custom node that encodes state by shape as well as colour (ring, dashed ring, fill), so it reads without colour vision.

## Testing

```sh
npm test            # vitest run
npm run typecheck   # app config, then the strict engine config
```

The suite has 95 tests and runs in about 3 seconds locally. It tests the engine, not the React layer:

- **Against independent references.** Each sorting algorithm is checked against `Array.prototype.sort` on 900 seeded inputs (5 distributions × 9 sizes from 0 to 64 × 20 seeds). BFS and DFS are compared with separate reference implementations, and Dijkstra's distances with Bellman-Ford, on 300 seeded random graphs. N-Queens solutions match a brute-force search for n = 1 to 8.
- **Trace invariants.** Replaying a sorting trace reproduces the output; an index is marked sorted only when it holds its final value; every index is in bounds and every `line` exists in the pseudocode; counters equal the running sum of event costs; random-access frames equal a sequential replay. Every Sudoku placement is legal when made. Hanoi moves are replayed through a checker that rejects illegal moves.
- **Exact counts.** Bubble and selection sort make exactly n(n−1)/2 comparisons; insertion sort is linear on sorted input; quick sort with a last-element pivot hits its quadratic case on sorted input; merge sort stays within n⌈log₂ n⌉ comparisons.
- **Player clock.** Frame-rate independence, multi-step frames, stopping at the end, capping long gaps.

The engine and the clock compile under a separate strict config (`tsconfig.engine.json`: `strict`, `noUnusedLocals`). The rest of the app still uses the original non-strict config.

## Decisions and trade-offs

- **Record, then replay.** Recording the whole trace before playback costs memory, but it makes scrubbing, stepping backwards, exact counters and the ops-vs-n chart straightforward, and it keeps the algorithms free of UI code. A generator that the UI pulled from live would not support seeking backwards.
- **Bubble sort has no early exit.** It always makes n(n−1)/2 comparisons, which keeps it the textbook Θ(n²) baseline next to insertion sort, which is adaptive.
- **Quick sort uses Lomuto with the last element as pivot.** Simple to follow on screen, and it shows the sorted-input worst case honestly instead of hiding it with randomisation.
- **Ops-vs-n chart is measured, not drawn.** For each n in 8 to 256, the page runs the engine three times on seeded inputs and plots the mean operation count, with a least-squares fit of the expected growth shape for comparison.
- **Dijkstra rejects negative weights** with a message instead of running and producing wrong distances.
- **The BST is not balanced on purpose.** Inserting sorted values shows the degenerate O(n) case.
- **Dark theme by default**, chosen before first paint by an inline script (stored choice, then OS setting) to avoid a flash.

## Bundle

Measured with `vite build`, sizes gzipped with `gzip -9`, same method before and after the cleanup:

| | Before | After |
| --- | --- | --- |
| Entry JS | 679,701 B (212,102 B gzip) | 232,267 B (75,357 B gzip) |
| Entry CSS | 77,745 B (13,518 B gzip) | 33,969 B (7,354 B gzip) |
| All JS | 1,417,461 B in 301 files | 473,036 B in 15 files |

Most of the drop came from removing unused dependencies (react-code-blocks with its language chunks, recharts, react-query, form and date libraries, 46 unused UI components) and from code-splitting the routes; React Flow now loads only on `/graph`.

## Running locally

Requires Node 18 or newer (Vite 5); CI uses Node 20.

```sh
npm ci
npm run dev         # http://localhost:8080
npm test
npm run typecheck
npm run lint
npm run build       # output in dist/
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and build on pushes to `main` and on pull requests.

## Known limitations

- No grid pathfinding or A* yet; `/pathfinding` points to the graph page.
- Sorting traces are capped at two million events; with n ≤ 512 none of the algorithms reaches the cap.
- Sudoku replays at most the first 60,000 search steps.
- Only the engine is under the strict TypeScript config, and there are no component tests.

## Credits

Built by [Vlad Plastin](https://xvlad.dev). The first version started from a lovable.dev boilerplate; the engine, player and visualisers have since been rewritten.
