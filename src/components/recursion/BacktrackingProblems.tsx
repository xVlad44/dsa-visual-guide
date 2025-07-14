import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '../ui/use-toast';
import { 
  Repeat, 
  Play, 
  RotateCcw, 
  Crown, 
  Grid3x3, 
  Layers3, 
  Pause
} from 'lucide-react';

const RecursionVisualizer = () => {
  // Show Sudoku by default
  const [algorithm, setAlgorithm] = useState('sudoku');
  const [isRunning, setIsRunning] = useState(false);
  const [boardSize, setBoardSize] = useState(4);
  const [towerHeight, setTowerHeight] = useState(3);
  
  // N-Queens state
  const [queensBoard, setQueensBoard] = useState([]);
  const [queensSolution, setQueensSolution] = useState([]);
  
  // Sudoku state
  const [sudokuSize, setSudokuSize] = useState(9);
  const [sudokuBoard, setSudokuBoard] = useState([]);
  const { toast } = useToast();
  
  // Tower of Hanoi state
  const [towers, setTowers] = useState([
    [3, 2, 1], // Tower A
    [],        // Tower B
    []         // Tower C
  ]);
  const [moves, setMoves] = useState([]);
  const [hanoiStep, setHanoiStep] = useState(0);
  const [hanoiAnimating, setHanoiAnimating] = useState(false);

  const algorithms = [
    { value: 'nqueens', label: 'N-Queens Problem' },
    { value: 'sudoku', label: 'Sudoku Solver' },
    { value: 'hanoi', label: 'Tower of Hanoi' }
  ];

  const algorithmInfo = {
    nqueens: {
      description: "Place N queens on an N×N chessboard so that no two queens attack each other.",
      complexity: "O(N!)",
      technique: "Backtracking",
      difficulty: "Medium"
    },
    sudoku: {
      description: "Fill a 9×9 grid with digits so that each column, row, and 3×3 box contains all digits 1-9.",
      complexity: "O(9^(n*n))",
      technique: "Backtracking",
      difficulty: "Hard"
    },
    hanoi: {
      description: "Move all disks from one tower to another, with larger disks never on top of smaller ones.",
      complexity: "O(2^n)",
      technique: "Divide and Conquer",
      difficulty: "Easy"
    }
  };

  // Initialize boards
  const initializeNQueens = () => {
    const board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(false));
    setQueensBoard(board);
    setQueensSolution([]);
  };

  const initializeSudoku = (size = sudokuSize) => {
    // Empty board
    const board = Array(size).fill(0).map(() => Array(size).fill(0));
    setSudokuBoard(board);
  };

  const initializeTowers = () => {
    const initialTowers = [
      Array.from({ length: towerHeight }, (_, i) => towerHeight - i),
      [],
      []
    ];
    setTowers(initialTowers);
    setMoves([]);
  };

  const solveMockNQueens = () => {
    // Mock solution for demonstration
    const solution = [];
    for (let i = 0; i < boardSize; i++) {
      solution.push({ row: i, col: (i * 2) % boardSize });
    }
    setQueensSolution(solution);
  };


  // Sudoku solver for 4x4, 6x6, 9x9
  function getBoxDims(size) {
    if (size === 4) return { boxRows: 2, boxCols: 2 };
    if (size === 6) return { boxRows: 2, boxCols: 3 };
    return { boxRows: 3, boxCols: 3 };
  }

  function isSafe(board, row, col, num, size) {
    const { boxRows, boxCols } = getBoxDims(size);
    // Check row and col
    for (let x = 0; x < size; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    // Check box
    const startRow = row - (row % boxRows);
    const startCol = col - (col % boxCols);
    for (let i = 0; i < boxRows; i++) {
      for (let j = 0; j < boxCols; j++) {
        if (board[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  }

  function solveSudokuBacktrack(board, size) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!board[row][col]) {
          for (let num = 1; num <= size; num++) {
            if (isSafe(board, row, col, num, size)) {
              board[row][col] = num;
              if (solveSudokuBacktrack(board, size)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  const solveSudokuWithUserInput = () => {
    // Deep copy the board
    const inputBoard = sudokuBoard.map(row => row.slice());
    const size = sudokuSize;
    // Check if the board is empty (all zeros)
    const isEmpty = inputBoard.every(row => row.every(cell => cell === 0));
    if (isEmpty) {
      // If empty, do not solve, just keep it empty
      setSudokuBoard(Array(size).fill(0).map(() => Array(size).fill(0)));
      return;
    }
    const solved = solveSudokuBacktrack(inputBoard, size);
    if (solved) {
      setSudokuBoard(inputBoard);
    } else {
      toast({
        title: 'No solution',
        description: 'The current Sudoku board is unsolvable. Please check your input.',
        variant: 'destructive',
      });
      // Clear the board
      setSudokuBoard(Array(size).fill(0).map(() => Array(size).fill(0)));
    }
  };

  const solveMockHanoi = () => {
    // Mock solution - show final state
    setTowers([
      [],
      [],
      Array.from({ length: towerHeight }, (_, i) => towerHeight - i)
    ]);
    setMoves([
      `Move disk 1 from A to C`,
      `Move disk 2 from A to B`,
      `Move disk 1 from C to B`,
      `Move disk 3 from A to C`,
      `Move disk 1 from B to A`,
      `Move disk 2 from B to C`,
      `Move disk 1 from A to C`
    ]);
  };

  // Utility to generate all moves for Tower of Hanoi
  function getHanoiMoves(n: number, from: string, to: string, aux: string, moves: string[] = []) {
    if (n === 0) return moves;
    getHanoiMoves(n - 1, from, aux, to, moves);
    moves.push(`Move disk ${n} from ${from} to ${to}`);
    getHanoiMoves(n - 1, aux, to, from, moves);
    return moves;
  }

  // Generate all moves and states
  const hanoiMoves = getHanoiMoves(towerHeight, 'A', 'C', 'B');
  const totalSteps = hanoiMoves.length;

  // Compute towers state at each step
  function getTowersAtStep(step: number) {
    const towers = [
      Array.from({ length: towerHeight }, (_, i) => towerHeight - i),
      [],
      []
    ];
    const positions = { A: 0, B: 1, C: 2 };
    for (let i = 0; i < step; i++) {
      const match = hanoiMoves[i].match(/Move disk (\d+) from (\w) to (\w)/);
      if (match) {
        const [, diskStr, from, to] = match;
        const disk = parseInt(diskStr);
        const fromIdx = positions[from];
        const toIdx = positions[to];
        // Remove disk from source
        const diskIdx = towers[fromIdx].indexOf(disk);
        if (diskIdx !== -1) towers[fromIdx].splice(diskIdx, 1);
        // Add disk to destination
        towers[toIdx].push(disk);
        towers[toIdx].sort((a, b) => b - a); // Keep largest at bottom
      }
    }
    return towers;
  }

  const towersAtCurrentStep = getTowersAtStep(hanoiStep);

const hanoiTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

// Update playHanoiAnimation to store the timeout
function playHanoiAnimation() {
  setHanoiAnimating(true);
  let step = hanoiStep;
  function next() {
    if (step < totalSteps) {
      setHanoiStep(++step);
      hanoiTimeoutRef.current = setTimeout(next, 700);
    } else {
      setHanoiAnimating(false);
      hanoiTimeoutRef.current = null;
    }
  }
  next();
}

// Fix pauseHanoiAnimation to clear the timeout
function pauseHanoiAnimation() {
  setHanoiAnimating(false);
  if (hanoiTimeoutRef.current) {
    clearTimeout(hanoiTimeoutRef.current);
    hanoiTimeoutRef.current = null;
  }
}

// Also clear timeout on reset or unmount
React.useEffect(() => {
  return () => {
    if (hanoiTimeoutRef.current) {
      clearTimeout(hanoiTimeoutRef.current);
    }
  };
}, []);

  const runVisualization = () => {
    setIsRunning(true);
    switch (algorithm) {
      case 'nqueens':
        solveMockNQueens();
        break;
      case 'sudoku':
        solveSudokuWithUserInput();
        break;
      case 'hanoi':
        solveMockHanoi();
        break;
    }
    setTimeout(() => setIsRunning(false), 1000);
  };

  const resetVisualization = () => {
    switch (algorithm) {
      case 'nqueens':
        initializeNQueens();
        break;
      case 'sudoku':
        initializeSudoku();
        break;
      case 'hanoi':
        initializeTowers();
        break;
    }
  };

  const renderNQueens = () => {
    const board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(false));
    queensSolution.forEach(({ row, col }) => {
      if (board[row]) board[row][col] = true;
    });

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="number"
            min="4"
            max="10"
            value={boardSize}
            onChange={(e) => {
                const size = parseInt(e.target.value);
                if (size >= 4 && size <= 10) {
                    setBoardSize(size);
                    initializeNQueens();
                }

            }}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">Board Size</span>
        </div>
        
        <div className="grid gap-1 p-4 bg-muted/50 rounded-lg" style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}>
          {board.map((row, rowIndex) =>
            row.map((hasQueen, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                  (rowIndex + colIndex) % 2 === 0 ? 'bg-background' : 'bg-muted'
                }`}
              >
                {hasQueen && <Crown className="h-5 w-5 text-yellow-600" />}
              </div>
            ))
          )}
        </div>
        
        {queensSolution.length > 0 && (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800">
              Solution found! {queensSolution.length} queens placed.
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderSudoku = () => {
    // Determine box dimensions for each supported size
    let boxRows = 3, boxCols = 3;
    if (sudokuSize === 4) {
      boxRows = 2; boxCols = 2;
    } else if (sudokuSize === 6) {
      boxRows = 2; boxCols = 3;
    }
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-muted-foreground">Board Size</span>
          <select
            value={sudokuSize}
            onChange={e => {
              const size = parseInt(e.target.value);
              setSudokuSize(size);
              initializeSudoku(size);
            }}
            className="border rounded px-2 py-1 bg-background"
          >
            {[4, 6, 9].map(size => (
              <option key={size} value={size}>{size} x {size}</option>
            ))}
          </select>
        </div>
        <div
          className="grid gap-px bg-border p-2 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${sudokuSize}, 2rem)` }}
        >
          {sudokuBoard.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              // Alternate box coloring
              const boxRow = Math.floor(rowIndex / boxRows);
              const boxCol = Math.floor(colIndex / boxCols);
              const isAlt = (boxRow + boxCol) % 2 === 0;
              return (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="number"
                  min={1}
                  max={sudokuSize}
                  value={cell === 0 ? '' : cell}
                  onChange={e => {
                    let value = parseInt(e.target.value) || 0;
                    if (value < 0) value = 0;
                    if (value > sudokuSize) value = sudokuSize;
                    setSudokuBoard(prev => {
                      const next = prev.map(r => [...r]);
                      next[rowIndex][colIndex] = value;
                      return next;
                    });
                  }}
                  className={`w-8 h-8 text-center text-sm font-medium border
                    ${isAlt ? 'bg-muted/50' : 'bg-background'}
                  `}
                  style={{ outline: 'none' }}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };
  // Initialize Sudoku board on first render or when algorithm changes to sudoku
  React.useEffect(() => {
    if (algorithm === 'sudoku') {
      initializeSudoku(sudokuSize);
    }
    // eslint-disable-next-line
  }, [algorithm]);

  const renderTowerOfHanoi = () => {
    const maxHeight = towerHeight;
    const towerHeightPx = Math.max(260, maxHeight * 26); // Make towers taller for more disks

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="number"
            min="2"
            max="10"
            value={towerHeight}
            disabled={hanoiAnimating}
            onChange={(e) => {
              let height = parseInt(e.target.value);
              if (height >= 2 && height <= 10) {
                setTowerHeight(height);
                initializeTowers();
                setHanoiStep(0);
              }
            }}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">Number of Disks</span>
        </div>
        
        <div className="flex justify-center space-x-12" style={{ minHeight: towerHeightPx }}>
          {towersAtCurrentStep.map((tower, towerIndex) => (
            <div
              key={towerIndex}
              className="flex flex-col-reverse items-center justify-end"
              style={{
                height: towerHeightPx,
                width: 110,
                position: 'relative'
              }}
            >
              {/* Pillar */}
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 w-3 bg-border"
                style={{ height: towerHeightPx - 20, zIndex: 0, borderRadius: 4 }}
              ></div>
              {/* Disks */}
              <div
                className="flex flex-col items-center justify-end"
                style={{ height: towerHeightPx - 20, zIndex: 1, width: '100%' }}
              >
                {tower
                  .slice() // copy
                  .sort((a, b) => a - b) // smallest at top, largest at bottom
                  .map((disk, idx) => {
                    const isMoving =
                      hanoiMoves[hanoiStep - 1]?.includes(`disk ${disk}`) &&
                      towerIndex === "ABC".indexOf(hanoiMoves[hanoiStep - 1]?.slice(-1));
                    return (
                      <div
                        key={disk}
                        className={`rounded-md h-6 flex items-center justify-center text-xs font-medium mb-1 transition-all duration-300
                          ${isMoving ? 'bg-yellow-400 text-black scale-105' : 'bg-primary text-primary-foreground'}
                        `}
                        style={{
                          width: `${disk * 8 + 30}px`, // wider disks
                          minWidth: 36,
                          maxWidth: 100,
                        }}
                      >
                        {disk}
                      </div>
                    );
                  })}
              </div>
              <div className="text-sm font-medium mt-2">Tower {String.fromCharCode(65 + towerIndex)}</div>
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 mt-2">
          <Button onClick={() => setHanoiStep(0)} disabled={hanoiAnimating}>Reset</Button>
          <Button onClick={() => setHanoiStep(s => Math.max(0, s - 1))} disabled={hanoiStep === 0 || hanoiAnimating}>Prev</Button>
          <Button onClick={() => setHanoiStep(s => Math.min(totalSteps, s + 1))} disabled={hanoiStep === totalSteps || hanoiAnimating}>Next</Button>
          {!hanoiAnimating ? (
            <Button onClick={playHanoiAnimation} disabled={hanoiStep === totalSteps || hanoiAnimating}>
              <Play className="h-4 w-4 mr-2" />Play
            </Button>
          ) : (
            <Button onClick={pauseHanoiAnimation} disabled={hanoiStep === totalSteps || !hanoiAnimating}>
              <Pause className="h-4 w-4 mr-2" />Pause
            </Button>
          )}
        </div>

        {/* Step info */}
        <div className="mt-2 text-center">
          <div className="text-sm font-medium mb-1">Step {hanoiStep} / {totalSteps}</div>
          {hanoiStep > 0 && <div className="text-muted-foreground">{hanoiMoves[hanoiStep - 1]}</div>}
        </div>
      </div>
    );
  };

  const currentInfo = algorithmInfo[algorithm];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            Recursion & Backtracking
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore recursive algorithms and backtracking techniques
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Algorithm</label>
                  <Select value={algorithm} onValueChange={setAlgorithm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {algorithms.map((algo) => (
                        <SelectItem key={algo.value} value={algo.value}>
                          {algo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Only show Solve/Reset for nqueens and sudoku */}
                {(algorithm === 'nqueens' || algorithm === 'sudoku') && (
                  <div className="space-y-2">
                    <Button 
                      onClick={runVisualization} 
                      disabled={isRunning}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isRunning ? 'Solving...' : 'Solve'}
                    </Button>
                    <Button 
                      onClick={resetVisualization} 
                      variant="outline"
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Algorithm Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Technique:</span>
                  <Badge className="ml-2">{currentInfo.technique}</Badge>
                </div>
                <div>
                  <span className="font-medium">Complexity:</span>
                  <Badge className="ml-2">{currentInfo.complexity}</Badge>
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>
                  <Badge className={`ml-2 ${
                    currentInfo.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    currentInfo.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentInfo.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentInfo.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {algorithm === 'nqueens' && <Crown className="h-5 w-5" />}
                  {algorithm === 'sudoku' && <Grid3x3 className="h-5 w-5" />}
                  {algorithm === 'hanoi' && <Layers3 className="h-5 w-5" />}
                  {algorithms.find(a => a.value === algorithm)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-6 rounded-lg border-2 border-dashed border-border min-h-96">
                  {algorithm === 'nqueens' && renderNQueens()}
                  {algorithm === 'sudoku' && renderSudoku()}
                  {algorithm === 'hanoi' && renderTowerOfHanoi()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecursionVisualizer;