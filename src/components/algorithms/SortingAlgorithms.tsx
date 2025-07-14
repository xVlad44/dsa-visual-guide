
import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Shuffle, Settings, Code2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ArrayBar, ArrayBarState } from '../ArrayBar';
import { AlgorithmLayout } from '../AlgorithmLayout';

interface SortState {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
  left?: number;
  right?: number;
  currentStep: number;
  isComplete: boolean;
  steps: SortStep[];
}

interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
  left?: number;
  right?: number;
  description: string;
  codeLine?: number;
}

type SortAlgorithm = 'bubble' | 'insertion' | 'selection' | 'merge' | 'quick';

const algorithms = {
  bubble: { name: 'Bubble Sort', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' },
  insertion: { name: 'Insertion Sort', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' },
  selection: { name: 'Selection Sort', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' },
  merge: { name: 'Merge Sort', timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)' },
  quick: { name: 'Quick Sort', timeComplexity: 'O(n log n)', spaceComplexity: 'O(log n)' }
};

const codeExamples = {
  bubble: [
    'function bubbleSort(arr) {',
    '  for (let i = 0; i < arr.length - 1; i++) {',
    '    for (let j = 0; j < arr.length - i - 1; j++) {',
    '      if (arr[j] > arr[j + 1]) {',
    '        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];',
    '      }',
    '    }',
    '  }',
    '  return arr;',
    '}'
  ],
  insertion: [
    'function insertionSort(arr) {',
    '  for (let i = 1; i < arr.length; i++) {',
    '    let key = arr[i];',
    '    let j = i - 1;',
    '    while (j >= 0 && arr[j] > key) {',
    '      arr[j + 1] = arr[j];',
    '      j--;',
    '    }',
    '    arr[j + 1] = key;',
    '  }',
    '  return arr;',
    '}'
  ],
  selection: [
    'function selectionSort(arr) {',
    '  for (let i = 0; i < arr.length - 1; i++) {',
    '    let minIndex = i;',
    '    for (let j = i + 1; j < arr.length; j++) {',
    '      if (arr[j] < arr[minIndex]) {',
    '        minIndex = j;',
    '      }',
    '    }',
    '    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];',
    '  }',
    '  return arr;',
    '}'
  ],
  merge: [
    'function mergeSort(arr) {',
    '  if (arr.length <= 1) return arr;',
    '  const mid = Math.floor(arr.length / 2);',
    '  const left = mergeSort(arr.slice(0, mid));',
    '  const right = mergeSort(arr.slice(mid));',
    '  return merge(left, right);',
    '}',
    'function merge(left, right) {',
    '  let result = [], i = 0, j = 0;',
    '  while (i < left.length && j < right.length) {',
    '    result.push(left[i] <= right[j] ? left[i++] : right[j++]);',
    '  }',
    '  return result.concat(left.slice(i), right.slice(j));',
    '}'
  ],
  quick: [
    'function quickSort(arr, low = 0, high = arr.length - 1) {',
    '  if (low < high) {',
    '    const pi = partition(arr, low, high);',
    '    quickSort(arr, low, pi - 1);',
    '    quickSort(arr, pi + 1, high);',
    '  }',
    '  return arr;',
    '}',
    'function partition(arr, low, high) {',
    '  const pivot = arr[high];',
    '  let i = low - 1;',
    '  for (let j = low; j < high; j++) {',
    '    if (arr[j] < pivot) {',
    '      i++;',
    '      [arr[i], arr[j]] = [arr[j], arr[i]];',
    '    }',
    '  }',
    '  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];',
    '  return i + 1;',
    '}'
  ]
};

export function SortingAlgorithms() {
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>('bubble');
  const [arraySize, setArraySize] = useState(8);
  const [speed, setSpeed] = useState(500);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [state, setState] = useState<SortState>(() => ({
    array: generateRandomArray(8),
    comparing: [],
    swapping: [],
    sorted: [],
    currentStep: 0,
    isComplete: false,
    steps: []
  }));

  function generateRandomArray(size: number): number[] {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
  }

  const resetArray = useCallback(() => {
    const newArray = generateRandomArray(arraySize);
    const steps = generateSteps(newArray, algorithm);
    setState({
      array: newArray,
      comparing: [],
      swapping: [],
      sorted: [],
      currentStep: 0,
      isComplete: false,
      steps
    });
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [arraySize, algorithm]);

  const generateSteps = (arr: number[], algo: SortAlgorithm): SortStep[] => {
    const steps: SortStep[] = [];
    const workingArray = [...arr];
    
    switch (algo) {
      case 'bubble':
        generateBubbleSortSteps(workingArray, steps);
        break;
      case 'insertion':
        generateInsertionSortSteps(workingArray, steps);
        break;
      case 'selection':
        generateSelectionSortSteps(workingArray, steps);
        break;
      case 'merge':
        generateMergeSortSteps(workingArray, steps);
        break;
      case 'quick':
        generateQuickSortSteps(workingArray, steps);
        break;
    }
    
    return steps;
  };

  const generateBubbleSortSteps = (arr: number[], steps: SortStep[]) => {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: [],
          sorted: Array.from({ length: i }, (_, idx) => n - 1 - idx),
          description: `Comparing elements at positions ${j} and ${j + 1}`,
          codeLine: 3
        });
        
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [j, j + 1],
            sorted: Array.from({ length: i }, (_, idx) => n - 1 - idx),
            description: `Swapping elements at positions ${j} and ${j + 1}`,
            codeLine: 4
          });
        }
      }
    }
    
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: n }, (_, idx) => idx),
      description: 'Sorting complete!',
      codeLine: 8
    });
  };

  const generateInsertionSortSteps = (arr: number[], steps: SortStep[]) => {
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      
      steps.push({
        array: [...arr],
        comparing: [i],
        swapping: [],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        description: `Inserting element ${key} into sorted portion`,
        codeLine: 2
      });
      
      while (j >= 0 && arr[j] > key) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: [],
          sorted: Array.from({ length: i }, (_, idx) => idx),
          description: `Moving element ${arr[j]} to the right`,
          codeLine: 5
        });
        
        arr[j + 1] = arr[j];
        j--;
      }
      
      arr[j + 1] = key;
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [j + 1],
        sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
        description: `Placed element ${key} in correct position`,
        codeLine: 8
      });
    }
  };

  const generateSelectionSortSteps = (arr: number[], steps: SortStep[]) => {
    for (let i = 0; i < arr.length - 1; i++) {
      let minIndex = i;
      
      for (let j = i + 1; j < arr.length; j++) {
        steps.push({
          array: [...arr],
          comparing: [minIndex, j],
          swapping: [],
          sorted: Array.from({ length: i }, (_, idx) => idx),
          description: `Comparing elements to find minimum`,
          codeLine: 4
        });
        
        if (arr[j] < arr[minIndex]) {
          minIndex = j;
        }
      }
      
      if (minIndex !== i) {
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [i, minIndex],
          sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
          description: `Swapping minimum element to position ${i}`,
          codeLine: 8
        });
      }
    }
  };

  const generateMergeSortSteps = (arr: number[], steps: SortStep[]) => {
    // Simplified merge sort visualization
    const n = arr.length;
    for (let size = 1; size < n; size *= 2) {
      for (let start = 0; start < n; start += 2 * size) {
        const mid = Math.min(start + size, n);
        const end = Math.min(start + 2 * size, n);
        
        steps.push({
          array: [...arr],
          comparing: Array.from({ length: end - start }, (_, i) => start + i),
          swapping: [],
          sorted: [],
          left: start,
          right: end - 1,
          description: `Merging subarrays [${start}-${mid-1}] and [${mid}-${end-1}]`,
          codeLine: 8
        });
        
        // Merge logic would go here
        mergeSubarrays(arr, start, mid, end);
      }
    }
    
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: n }, (_, idx) => idx),
      description: 'Merge sort complete!',
      codeLine: 6
    });
  };

  const mergeSubarrays = (arr: number[], start: number, mid: number, end: number) => {
    const left = arr.slice(start, mid);
    const right = arr.slice(mid, end);
    let i = 0, j = 0, k = start;
    
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
    }
    
    while (i < left.length) arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
  };

  const generateQuickSortSteps = (arr: number[], steps: SortStep[]) => {
    const quickSortHelper = (low: number, high: number) => {
      if (low < high) {
        const pi = partition(arr, low, high, steps);
        quickSortHelper(low, pi - 1);
        quickSortHelper(pi + 1, high);
      }
    };
    
    quickSortHelper(0, arr.length - 1);
    
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: arr.length }, (_, idx) => idx),
      description: 'Quick sort complete!',
      codeLine: 6
    });
  };

  const partition = (arr: number[], low: number, high: number, steps: SortStep[]): number => {
    const pivot = arr[high];
    let i = low - 1;
    
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [],
      pivot: high,
      left: low,
      right: high,
      description: `Pivot selected: ${pivot}`,
      codeLine: 8
    });
    
    for (let j = low; j < high; j++) {
      steps.push({
        array: [...arr],
        comparing: [j, high],
        swapping: [],
        sorted: [],
        pivot: high,
        description: `Comparing ${arr[j]} with pivot ${pivot}`,
        codeLine: 11
      });
      
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [i, j],
          sorted: [],
          pivot: high,
          description: `Swapping ${arr[j]} to left partition`,
          codeLine: 14
        });
      }
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  };

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep >= prev.steps.length - 1) {
        return { ...prev, isComplete: true };
      }
      
      const nextStep = prev.steps[prev.currentStep + 1];
      return {
        ...prev,
        ...nextStep,
        currentStep: prev.currentStep + 1,
        isComplete: prev.currentStep + 1 >= prev.steps.length - 1
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep <= 0) return prev;
      
      const prevStepData = prev.steps[prev.currentStep - 1];
      return {
        ...prev,
        ...prevStepData,
        currentStep: prev.currentStep - 1,
        isComplete: false
      };
    });
  }, []);

  const startSorting = useCallback(() => {
    if (state.isComplete) return;
    
    setIsPlaying(true);
    const runStep = () => {
      nextStep();
      timeoutRef.current = setTimeout(runStep, speed);
    };
    timeoutRef.current = setTimeout(runStep, speed);
  }, [nextStep, speed, state.isComplete]);

  const pauseSorting = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    if (state.isComplete) {
      setIsPlaying(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [state.isComplete]);

  React.useEffect(() => {
    resetArray();
  }, [algorithm, arraySize, resetArray]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function getBarState(index: number): ArrayBarState {
    if (state.sorted.includes(index)) return 'sorted';
    if (state.swapping.includes(index)) return 'swapping';
    if (state.comparing.includes(index)) return 'comparing';
    if (state.pivot === index) return 'active';
    return 'default';
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-4">
      <Tabs value={algorithm} onValueChange={(value) => setAlgorithm(value as SortAlgorithm)}>
        <TabsList>
          <TabsTrigger value="bubble">Bubble</TabsTrigger>
          <TabsTrigger value="insertion">Insertion</TabsTrigger>
          <TabsTrigger value="selection">Selection</TabsTrigger>
          <TabsTrigger value="merge">Merge</TabsTrigger>
          <TabsTrigger value="quick">Quick</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          onClick={isPlaying ? pauseSorting : startSorting}
          disabled={state.isComplete}
          variant="gradient"
          size="lg"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <Button
          onClick={prevStep}
          disabled={isPlaying || state.currentStep === 0}
          variant="outline"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={isPlaying || state.isComplete}
          variant="outline"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <Button onClick={resetArray} variant="outline">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        
        <Button onClick={() => {
          resetArray();
          setTimeout(resetArray, 100);
        }} variant="outline">
          <Shuffle className="h-4 w-4" />
          Shuffle
        </Button>

        <Button
          onClick={() => setShowCode(!showCode)}
          variant="outline"
        >
          <Code2 className="h-4 w-4" />
          Code
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Size:</span>
          <Slider
            value={[arraySize]}
            onValueChange={([value]) => setArraySize(value)}
            min={4}
            max={15}
            step={1}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground w-8">{arraySize}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Speed:</span>
          <Slider
            value={[1100 - speed]}
            onValueChange={([value]) => setSpeed(1100 - value)}
            min={100}
            max={1000}
            step={50}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">{algorithms[algorithm].name}</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Step: </span>
            <span className="text-muted-foreground">{state.currentStep + 1} / {state.steps.length}</span>
          </div>
          <div>
            <span className="font-medium">Time Complexity: </span>
            <span className="text-muted-foreground">{algorithms[algorithm].timeComplexity}</span>
          </div>
          <div>
            <span className="font-medium">Space Complexity: </span>
            <span className="text-muted-foreground">{algorithms[algorithm].spaceComplexity}</span>
          </div>
        </div>
      </div>

      {state.steps[state.currentStep] && (
        <div>
          <h4 className="font-medium mb-2">Current Step</h4>
          <p className="text-sm text-muted-foreground">
            {state.steps[state.currentStep].description}
          </p>
        </div>
      )}

      {showCode && (
        <div>
          <h4 className="font-medium mb-2">Code</h4>
          <Card className="p-3 bg-muted">
            <pre className="text-xs">
              {codeExamples[algorithm].map((line, index) => (
                <div 
                  key={index}
                  className={`${
                    state.steps[state.currentStep]?.codeLine === index 
                      ? 'bg-primary/20 text-primary' 
                      : ''
                  } px-1 rounded`}
                >
                  {line}
                </div>
              ))}
            </pre>
          </Card>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Color Legend</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-algo-default rounded border"></div>
            <span>Unsorted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-algo-comparing rounded border"></div>
            <span>Comparing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-algo-swapping rounded border"></div>
            <span>Swapping</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-algo-active rounded border"></div>
            <span>Pivot/Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-algo-sorted rounded border"></div>
            <span>Sorted</span>
          </div>
        </div>
      </div>

      {state.isComplete && (
        <Card className="p-4 bg-success/10 border-success">
          <div className="text-center">
            <h4 className="font-semibold text-success">Sorting Complete! 🎉</h4>
            <p className="text-sm text-success/80 mt-1">
              Completed in {state.steps.length} steps
            </p>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <AlgorithmLayout
      title="Sorting Algorithm Visualizer"
      description="Compare and learn different sorting algorithms with step-by-step visualizations"
      controls={controls}
      sidebar={sidebar}
    >
      <div className="flex items-end justify-center space-x-2 min-h-[350px]">
        {state.array.map((value, index) => (
          <ArrayBar
            key={index}
            value={value}
            state={getBarState(index)}
            index={index}
            maxValue={Math.max(...state.array)}
          />
        ))}
      </div>
    </AlgorithmLayout>
  );
}
