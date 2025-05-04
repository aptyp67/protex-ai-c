import { useState, useCallback, useEffect, useRef } from "react";
import {
  Annotation,
  AnnotationMode,
  AnnotationType,
  Point,
  ExportedAnnotations,
} from "../types";
import {
  createPolygonAnnotation,
  createArrowAnnotation,
  isPointNearPoint,
  isPointInPolygon,
  isPointNearLine,
  calculateScaledPoint,
} from "../utils/annotation";

interface UseAnnotationProps {
  imageUrl: string | null;
}

interface UseAnnotationReturn {
  annotations: Annotation[];
  tempPoints: Point[];
  mode: AnnotationMode;
  selectedAnnotation: Annotation | null;
  isDragging: boolean;
  imageElement: HTMLImageElement | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  loadedImageUrl: string | null;
  handleImageContainerClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleImageContainerMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleImageContainerMouseUp: () => void;
  handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  setMode: (mode: AnnotationMode) => void;
  resetAnnotation: () => void;
  deleteSelectedAnnotation: () => void;
  deleteSelectedPoint: () => void;
  exportAnnotations: () => ExportedAnnotations;
  exportAnnotationsAsImage: () => string;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  completePolygon: () => void;
}

interface AnnotationHistoryState {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  selectedPointIndex: number | null;
}

export const useAnnotation = ({
  imageUrl,
}: UseAnnotationProps): UseAnnotationReturn => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<AnnotationMode>(AnnotationMode.SELECT);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<AnnotationHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const skipHistoryRef = useRef(false);

  const startDragPointRef = useRef<Point | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const annotationsRef = useRef<Annotation[]>(annotations);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < history.length - 1);
  }, [history, historyIndex]);

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
  }, [history, historyIndex]);

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
  }, [history, historyIndex]);

  const lastStateRef = useRef<AnnotationHistoryState | null>(null);

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
  ]);

  useEffect(() => {
    setSelectedAnnotation(null);
    setSelectedPointIndex(null);
    setTempPoints([]);
  }, [mode]);

  useEffect(() => {
    if (imageUrl !== loadedImageUrl) {
      setAnnotations([]);
      setTempPoints([]);
      setSelectedAnnotation(null);
      setSelectedPointIndex(null);
      setIsDragging(false);
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [imageUrl, loadedImageUrl]);

  const getRelativeCoordinates = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): Point => {
      if (!e.currentTarget) return { x: 0, y: 0 };

      const rect = e.currentTarget.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      setImageElement(img);
      setImageNaturalWidth(img.naturalWidth);
      setImageNaturalHeight(img.naturalHeight);
      setLoadedImageUrl(img.src);
    },
    []
  );

  const handleImageContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const point = getRelativeCoordinates(e);
      const currentAnnotations = annotationsRef.current;

      if (mode === AnnotationMode.POLYGON) {
        setTempPoints((prevPoints) => {
          const newTempPoints = [...prevPoints, point];

          if (prevPoints.length > 1 && isPointNearPoint(point, prevPoints[0])) {
            const closedPolygonPoints = [...prevPoints];
            if (closedPolygonPoints.length >= 3) {
              const newPolygonAnnotation =
                createPolygonAnnotation(closedPolygonPoints);
              setAnnotations((prev) => [...prev, newPolygonAnnotation]);
            }
            return [];
          }

          return newTempPoints;
        });
      } else if (mode === AnnotationMode.ARROW) {
        setTempPoints((prevPoints) => {
          if (prevPoints.length === 0) {
            return [point];
          } else {
            const newArrowAnnotation = createArrowAnnotation(
              prevPoints[0],
              point
            );
            setAnnotations((prev) => [...prev, newArrowAnnotation]);
            return [];
          }
        });
      } else if (mode === AnnotationMode.SELECT) {
        let found = false;

        for (let i = 0; i < currentAnnotations.length; i++) {
          const annotation = currentAnnotations[i];
          for (let j = 0; j < annotation.points.length; j++) {
            if (isPointNearPoint(point, annotation.points[j])) {
              setSelectedAnnotation(annotation);
              setSelectedPointIndex(j);
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          for (let i = 0; i < currentAnnotations.length; i++) {
            const annotation = currentAnnotations[i];

            if (annotation.type === AnnotationType.POLYGON) {
              if (isPointInPolygon(point, annotation.points)) {
                setSelectedAnnotation(annotation);
                setSelectedPointIndex(null);
                startDragPointRef.current = point;
                setIsDragging(true);
                found = true;
                break;
              }
            } else if (annotation.type === AnnotationType.ARROW) {
              if (
                isPointNearLine(
                  point,
                  annotation.points[0],
                  annotation.points[1]
                )
              ) {
                setSelectedAnnotation(annotation);
                setSelectedPointIndex(null);
                startDragPointRef.current = point;
                setIsDragging(true);
                found = true;
                break;
              }
            }
          }
        }

        if (!found) {
          setSelectedAnnotation(null);
          setSelectedPointIndex(null);
        }
      }
    },
    [mode, getRelativeCoordinates]
  );

  const handleImageContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode === AnnotationMode.SELECT && isDragging) {
        const currentPoint = getRelativeCoordinates(e);

        if (!startDragPointRef.current || !selectedAnnotation) return;

        const dx = currentPoint.x - startDragPointRef.current.x;
        const dy = currentPoint.y - startDragPointRef.current.y;

        if (selectedPointIndex !== null) {
          setAnnotations((prevAnnotations) =>
            prevAnnotations.map((annotation) => {
              if (annotation.id === selectedAnnotation.id) {
                const newPoints = [...annotation.points];
                newPoints[selectedPointIndex] = {
                  x: newPoints[selectedPointIndex].x + dx,
                  y: newPoints[selectedPointIndex].y + dy,
                };
                return { ...annotation, points: newPoints };
              }
              return annotation;
            })
          );
        } else {
          setAnnotations((prevAnnotations) =>
            prevAnnotations.map((annotation) => {
              if (annotation.id === selectedAnnotation.id) {
                const newPoints = annotation.points.map((point) => ({
                  x: point.x + dx,
                  y: point.y + dy,
                }));
                return { ...annotation, points: newPoints };
              }
              return annotation;
            })
          );
        }

        startDragPointRef.current = currentPoint;
      }
    },
    [
      mode,
      isDragging,
      selectedAnnotation,
      selectedPointIndex,
      getRelativeCoordinates,
    ]
  );

  const handleImageContainerMouseUp = useCallback(() => {
    setIsDragging(false);
    startDragPointRef.current = null;
  }, []);

  const resetAnnotation = useCallback(() => {
    setTempPoints([]);
    setSelectedAnnotation(null);
    setSelectedPointIndex(null);
  }, []);

  const deleteSelectedAnnotation = useCallback(() => {
    if (selectedAnnotation) {
      setAnnotations((prevAnnotations) =>
        prevAnnotations.filter(
          (annotation) => annotation.id !== selectedAnnotation.id
        )
      );
      setSelectedAnnotation(null);
      setSelectedPointIndex(null);
    }
  }, [selectedAnnotation]);

  const deleteSelectedPoint = useCallback(() => {
    if (selectedAnnotation && selectedPointIndex !== null) {
      if (
        selectedAnnotation.type === AnnotationType.POLYGON &&
        selectedAnnotation.points.length > 3
      ) {
        setAnnotations((prevAnnotations) =>
          prevAnnotations.map((annotation) => {
            if (annotation.id === selectedAnnotation.id) {
              const newPoints = [...annotation.points];
              newPoints.splice(selectedPointIndex, 1);
              return { ...annotation, points: newPoints };
            }
            return annotation;
          })
        );
        setSelectedPointIndex(null);
      }
    }
  }, [selectedAnnotation, selectedPointIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAnnotation) {
          if (
            selectedPointIndex !== null &&
            selectedAnnotation.type === AnnotationType.POLYGON &&
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

  const exportAnnotations = useCallback((): ExportedAnnotations => {
    if (!imageElement) {
      return {
        imageWidth: 0,
        imageHeight: 0,
        annotations: [],
        metadata: {
          timestamp: Date.now(),
          version: "1.0.0",
          exportDate: new Date().toISOString(),
        },
      };
    }

    const containerWidth = imageElement.width;
    const containerHeight = imageElement.height;
    const currentAnnotations = annotationsRef.current;

    const exportedAnnotations = currentAnnotations.map((annotation) => {
      const exportedPoints = annotation.points.map((point) => {
        const pixelCoordinates = calculateScaledPoint(
          point,
          imageNaturalWidth,
          imageNaturalHeight,
          containerWidth,
          containerHeight
        );

        const normalizedCoordinates = {
          x: pixelCoordinates.x / imageNaturalWidth,
          y: pixelCoordinates.y / imageNaturalHeight,
        };

        return {
          pixelCoordinates,
          normalizedCoordinates,
        };
      });

      return {
        id: annotation.id,
        type: annotation.type,
        points: exportedPoints,
      };
    });

    return {
      imageWidth: imageNaturalWidth,
      imageHeight: imageNaturalHeight,
      annotations: exportedAnnotations,
      metadata: {
        timestamp: Date.now(),
        version: "1.0.0",
        exportDate: new Date().toISOString(),
      },
    };
  }, [imageElement, imageNaturalWidth, imageNaturalHeight]);

  const exportAnnotationsAsImage = useCallback((): string => {
    if (!imageElement) return "";
    const currentAnnotations = annotationsRef.current;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    canvas.width = imageNaturalWidth;
    canvas.height = imageNaturalHeight;

    ctx.drawImage(imageElement, 0, 0, imageNaturalWidth, imageNaturalHeight);

    const containerWidth = imageElement.width;
    const containerHeight = imageElement.height;

    currentAnnotations.forEach((annotation) => {
      const scaledPoints = annotation.points.map((point) =>
        calculateScaledPoint(
          point,
          imageNaturalWidth,
          imageNaturalHeight,
          containerWidth,
          containerHeight
        )
      );

      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      if (annotation.type === AnnotationType.POLYGON) {
        ctx.beginPath();
        ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);

        scaledPoints.slice(1).forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });

        ctx.closePath();
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.fill();
        ctx.stroke();
      } else if (annotation.type === AnnotationType.ARROW) {
        if (scaledPoints.length === 2) {
          const [start, end] = scaledPoints;

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = 20;

          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    });

    return canvas.toDataURL();
  }, [imageElement, imageNaturalWidth, imageNaturalHeight]);

  const completePolygon = useCallback(() => {
    if (mode === AnnotationMode.POLYGON && tempPoints.length >= 3) {
      const newPolygonAnnotation = createPolygonAnnotation(tempPoints);
      setAnnotations((prev) => [...prev, newPolygonAnnotation]);

      setTempPoints([]);
    }
  }, [mode, tempPoints]);

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
  };
};
