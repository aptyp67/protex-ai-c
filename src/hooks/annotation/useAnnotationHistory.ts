import { useCallback, useEffect, useRef } from "react";
import { Annotation } from "../../types";
import { AnnotationHistoryState } from "./types";

interface UseAnnotationHistoryProps {
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  selectedAnnotation: Annotation | null;
  setSelectedAnnotation: React.Dispatch<React.SetStateAction<Annotation | null>>;
  selectedPointIndex: number | null;
  setSelectedPointIndex: React.Dispatch<React.SetStateAction<number | null>>;
  history: AnnotationHistoryState[];
  setHistory: React.Dispatch<React.SetStateAction<AnnotationHistoryState[]>>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
}

interface UseAnnotationHistoryReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  skipHistoryRef: React.MutableRefObject<boolean>;
}

export const useAnnotationHistory = ({
  annotations,
  setAnnotations,
  selectedAnnotation,
  setSelectedAnnotation,
  selectedPointIndex,
  setSelectedPointIndex,
  history,
  setHistory,
  historyIndex,
  setHistoryIndex,
}: UseAnnotationHistoryProps): UseAnnotationHistoryReturn => {
  const [canUndo, canRedo] = [historyIndex > 0, historyIndex < history.length - 1];
  const skipHistoryRef = useRef(false);
  const lastStateRef = useRef<AnnotationHistoryState | null>(null);

  // Undo/redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];

      skipHistoryRef.current = true;
      setAnnotations(prevState.annotations);
      setSelectedAnnotation(prevState.selectedAnnotation);
      setSelectedPointIndex(prevState.selectedPointIndex);
      setHistoryIndex(newIndex);
    }
  }, [
    history,
    historyIndex,
    setAnnotations,
    setSelectedAnnotation,
    setSelectedPointIndex,
    setHistoryIndex,
  ]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];

      skipHistoryRef.current = true;
      setAnnotations(nextState.annotations);
      setSelectedAnnotation(nextState.selectedAnnotation);
      setSelectedPointIndex(nextState.selectedPointIndex);
      setHistoryIndex(newIndex);
    }
  }, [
    history,
    historyIndex,
    setAnnotations,
    setSelectedAnnotation,
    setSelectedPointIndex,
    setHistoryIndex,
  ]);

  // Track history for undo/redo operations
  // Only store a new history entry if the state has actually changed
  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }

    const currentState: AnnotationHistoryState = {
      annotations,
      selectedAnnotation,
      selectedPointIndex,
    };

    const lastState = lastStateRef.current;
    if (
      lastState &&
      JSON.stringify(lastState.annotations) ===
        JSON.stringify(currentState.annotations) &&
      lastState.selectedAnnotation?.id ===
        currentState.selectedAnnotation?.id &&
      lastState.selectedPointIndex === currentState.selectedPointIndex
    ) {
      return;
    }

    lastStateRef.current = currentState;

    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, currentState]);
    setHistoryIndex(newHistory.length);
  }, [
    annotations,
    selectedAnnotation,
    selectedPointIndex,
    history,
    historyIndex,
    setHistory,
    setHistoryIndex,
  ]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    skipHistoryRef,
  };
};