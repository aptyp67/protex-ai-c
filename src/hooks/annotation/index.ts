import { useState, useEffect, useRef } from "react";
import { Annotation, AnnotationMode, Point } from "../../types";
import { UseAnnotationProps, UseAnnotationReturn, AnnotationHistoryState } from "./types";

import { useZoom } from "./useZoom";
import { useAnnotationHistory } from "./useAnnotationHistory";
import { useAnnotationExport } from "./useAnnotationExport";
import { useImageHandling } from "./useImageHandling";
import { useAnnotationInteractions } from "./useAnnotationInteractions";
import { usePersistence } from "./usePersistence";

export const useAnnotation = ({
  imageUrl,
  fileName,
  containerWidth,
  containerHeight,
}: UseAnnotationProps): UseAnnotationReturn => {
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<AnnotationMode>(AnnotationMode.SELECT);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Image state
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [currentImageKey, setCurrentImageKey] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<AnnotationHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  // Refs to avoid stale closures
  const skipSavingRef = useRef(false);
  
  // Computed properties
  const isMaxZoom = zoomLevel >= 2;
  const isMinZoom = zoomLevel <= 0.2;

  // Zoom management hook
  const {
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    getRelativeCoordinates,
  } = useZoom(zoomLevel, setZoomLevel);

  // History management hook
  const {
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAnnotationHistory({
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
  });

  // Annotation export hook
  const {
    exportAnnotations,
    exportAnnotationsAsImage,
  } = useAnnotationExport({
    annotations,
    imageElement,
    imageNaturalWidth,
    imageNaturalHeight,
    containerWidth,
    containerHeight,
  });

  // Image handling hook
  const {
    handleImageLoad,
    clearAllAnnotations,
  } = useImageHandling({
    fileName,
    setImageElement,
    setImageNaturalWidth,
    setImageNaturalHeight,
    setCurrentImageKey,
    setLoadedImageUrl,
    setAnnotations,
    skipSavingRef,
  });

  // Annotation interaction hook
  const {
    handleImageContainerClick,
    handleImageContainerMouseMove,
    handleImageContainerMouseUp,
    resetAnnotation,
    deleteSelectedAnnotation,
    deleteSelectedPoint,
    completePolygon,
  } = useAnnotationInteractions({
    annotations,
    tempPoints,
    mode,
    selectedAnnotation,
    selectedPointIndex,
    zoomLevel,
    setAnnotations,
    setTempPoints,
    setSelectedAnnotation,
    setSelectedPointIndex,
    setIsDragging,
    getRelativeCoordinates,
  });

  // Persistence hook
  usePersistence({
    annotations,
    currentImageKey,
    imageNaturalWidth,
    imageNaturalHeight,
    skipSavingRef,
  });

  // Reset selection when mode changes
  useEffect(() => {
    setSelectedAnnotation(null);
    setSelectedPointIndex(null);
    setTempPoints([]);
  }, [mode]);

  // Reset state when image changes
  useEffect(() => {
    if (imageUrl !== loadedImageUrl) {
      setTempPoints([]);
      setSelectedAnnotation(null);
      setSelectedPointIndex(null);
      setIsDragging(false);
      setHistory([]);
      setHistoryIndex(-1);
      setZoomLevel(1);
    }
  }, [imageUrl, loadedImageUrl]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAnnotation) {
          if (
            selectedPointIndex !== null &&
            selectedAnnotation.type === "polygon" &&
            selectedAnnotation.points.length > 3
          ) {
            deleteSelectedPoint();
          } else {
            deleteSelectedAnnotation();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedAnnotation,
    selectedPointIndex,
    deleteSelectedAnnotation,
    deleteSelectedPoint,
  ]);

  return {
    annotations,
    tempPoints,
    mode,
    selectedAnnotation,
    isDragging,
    imageElement,
    imageNaturalWidth,
    imageNaturalHeight,
    loadedImageUrl,
    handleImageContainerClick,
    handleImageContainerMouseMove,
    handleImageContainerMouseUp,
    handleImageLoad,
    setMode,
    resetAnnotation,
    deleteSelectedAnnotation,
    deleteSelectedPoint,
    exportAnnotations,
    exportAnnotationsAsImage,
    undo,
    redo,
    canUndo,
    canRedo,
    completePolygon,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    isMaxZoom,
    isMinZoom,
    clearAllAnnotations: () => clearAllAnnotations(currentImageKey),
    getRelativeCoordinates,
  };
};