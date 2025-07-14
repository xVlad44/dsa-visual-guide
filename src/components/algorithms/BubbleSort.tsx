import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Shuffle, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Card } from '../ui/card';
import { ArrayBar, ArrayBarState } from '../ArrayBar';
import { AlgorithmLayout } from '../AlgorithmLayout';

interface SortState {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  currentI: number;
  currentJ: number;
  isComplete: boolean;
}

export function BubbleSort() {
  const [arraySize, setArraySize] = useState(8);
  const [speed, setSpeed] = useState(500);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [state, setState] = useState<SortState>(() => ({
    array: generateRandomArray(8),
    comparing: [],
    swapping: [],
    sorted: [],
    currentI: 0,
    currentJ: 0,
    isComplete: false
  }));

  function generateRandomArray(size: number): number[] {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
  }

  const resetArray = useCallback(() => {
    setState({
      array: generateRandomArray(arraySize),
      comparing: [],
      swapping: [],
      sorted: [],
      currentI: 0,
      currentJ: 0,
      isComplete: false
    });
    setStepCount(0);
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [arraySize]);

  const bubbleSortStep = useCallback(() => {
    setState(prevState => {
      if (prevState.isComplete) return prevState;

      const { array, currentI, currentJ } = prevState;
      const n = array.length;

      // If we've completed all passes
      if (currentI >= n - 1) {
        return {
          ...prevState,
          comparing: [],
          swapping: [],
          sorted: array.map((_, index) => index),
          isComplete: true
        };
      }

      // If we've completed current pass
      if (currentJ >= n - currentI - 1) {
        return {
          ...prevState,
          currentI: currentI + 1,
          currentJ: 0,
          comparing: [],
          swapping: [],
          sorted: [...prevState.sorted, n - currentI - 1]
        };
      }

      // Compare adjacent elements
      const newArray = [...array];
      const needsSwap = array[currentJ] > array[currentJ + 1];

      if (needsSwap) {
        // Swap elements
        [newArray[currentJ], newArray[currentJ + 1]] = [newArray[currentJ + 1], newArray[currentJ]];
        
        return {
          ...prevState,
          array: newArray,
          comparing: [],
          swapping: [currentJ, currentJ + 1],
          currentJ: currentJ + 1
        };
      } else {
        return {
          ...prevState,
          comparing: [currentJ, currentJ + 1],
          swapping: [],
          currentJ: currentJ + 1
        };
      }
    });

    setStepCount(prev => prev + 1);
  }, []);

  const startSorting = useCallback(() => {
    if (state.isComplete) return;
    
    setIsPlaying(true);
    const runStep = () => {
      bubbleSortStep();
      timeoutRef.current = setTimeout(runStep, speed);
    };
    timeoutRef.current = setTimeout(runStep, speed);
  }, [bubbleSortStep, speed, state.isComplete]);

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
  }, [arraySize, resetArray]);

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
    if (index === state.currentJ || index === state.currentJ + 1) return 'active';
    return 'default';
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-4">
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
          onClick={bubbleSortStep}
          disabled={isPlaying || state.isComplete}
          variant="outline"
        >
          <SkipForward className="h-4 w-4" />
          Step
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
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Size:</span>
          <Slider
            value={[arraySize]}
            onValueChange={([value]) => setArraySize(value)}
            min={4}
            max={12}
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
        <h3 className="text-lg font-semibold mb-3">Algorithm Info</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Steps: </span>
            <span className="text-muted-foreground">{stepCount}</span>
          </div>
          <div>
            <span className="font-medium">Time Complexity: </span>
            <span className="text-muted-foreground">O(n²)</span>
          </div>
          <div>
            <span className="font-medium">Space Complexity: </span>
            <span className="text-muted-foreground">O(1)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">How it Works</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bubble Sort repeatedly compares adjacent elements and swaps them if they're in the wrong order. 
          The largest element "bubbles up" to its correct position after each pass.
        </p>
      </div>

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
              Completed in {stepCount} steps
            </p>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <AlgorithmLayout
      title="Bubble Sort Visualization"
      description="Watch how Bubble Sort compares adjacent elements and swaps them to sort the array"
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