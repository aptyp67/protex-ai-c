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
  generateImageKey,
} from "../utils/annotation";

interface UseAnnotationProps {
  imageUrl: string | null;
  fileName: string | null;
  containerWidth: number;
  containerHeight: number;
}

interface StoredAnnotations {
  annotations: Annotation[];
  timestamp: number;
  naturalWidth: number;
  naturalHeight: number;
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
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  isMaxZoom: boolean;
  isMinZoom: boolean;
  clearAllAnnotations: () => void;
  getRelativeCoordinates: (e: React.MouseEvent<HTMLDivElement>) => Point;
}

interface AnnotationHistoryState {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  selectedPointIndex: number | null;
}

const STORAGE_KEY_PREFIX = "protexai-annotations-";

export const useAnnotation = ({
  imageUrl,
  fileName,
  containerWidth,
  containerHeight,
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [currentImageKey, setCurrentImageKey] = useState<string | null>(null);

  const [history, setHistory] = useState<AnnotationHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const skipHistoryRef = useRef(false);
  const skipSavingRef = useRef(false);

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

  useEffect(() => {
    if (currentImageKey && !skipSavingRef.current && annotations.length > 0) {
      const dataToStore: StoredAnnotations = {
        annotations,
        timestamp: Date.now(),
        naturalWidth: imageNaturalWidth,
        naturalHeight: imageNaturalHeight,
      };
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${currentImageKey}`,
        JSON.stringify(dataToStore)
      );
    }

    if (skipSavingRef.current) {
      skipSavingRef.current = false;
    }
  }, [annotations, currentImageKey, imageNaturalWidth, imageNaturalHeight]);

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
      setTempPoints([]);
      setSelectedAnnotation(null);
      setSelectedPointIndex(null);
      setIsDragging(false);
      setHistory([]);
      setHistoryIndex(-1);
      setZoomLevel(1);
    }
  }, [imageUrl, loadedImageUrl]);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.2));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const isMaxZoom = zoomLevel >= 1;
  const isMinZoom = zoomLevel <= 0.2;

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY || e.deltaX;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      setZoomLevel((prevZoom) => {
        const newZoom = prevZoom * zoomFactor;
        return Math.min(Math.max(newZoom, 0.2), 1);
      });
    }
  }, []);

  const getRelativeCoordinates = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): Point => {
      if (!e.currentTarget) return { x: 0, y: 0 };

      const rect = e.currentTarget.getBoundingClientRect();

      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      return {
        x: rawX / zoomLevel,
        y: rawY / zoomLevel,
      };
    },
    [zoomLevel]
  );

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      setImageElement(img);
      setImageNaturalWidth(naturalWidth);
      setImageNaturalHeight(naturalHeight);

      let imageKey;
      if (fileName) {
        imageKey = `${fileName}_${naturalWidth}x${naturalHeight}`;
      } else {
        imageKey = generateImageKey(img.src, naturalWidth, naturalHeight);
      }

      console.log("Using storage key:", imageKey);
      setCurrentImageKey(imageKey);

      try {
        const storedData = localStorage.getItem(
          `${STORAGE_KEY_PREFIX}${imageKey}`
        );
        if (storedData) {
          const parsedData: StoredAnnotations = JSON.parse(storedData);

          if (
            parsedData.naturalWidth === naturalWidth &&
            parsedData.naturalHeight === naturalHeight
          ) {
            skipSavingRef.current = true;
            setAnnotations(parsedData.annotations);
            console.log(
              "Loaded annotations from localStorage:",
              parsedData.annotations.length
            );
          } else {
            console.log(
              "Image dimensions do not match stored dimensions, resetting annotations"
            );
            setAnnotations([]);
          }
        } else {
          console.log("No stored annotations found for this image");
          setAnnotations([]);
        }
      } catch (error) {
        console.error("Error loading annotations from localStorage:", error);
        setAnnotations([]);
      }

      setLoadedImageUrl(img.src);
    },
    [fileName]
  );

  const handleImageContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const point = getRelativeCoordinates(e);
      const currentAnnotations = annotationsRef.current;

      if (mode === AnnotationMode.POLYGON) {
        setTempPoints((prevPoints) => {
          const newTempPoints = [...prevPoints, point];

          if (
            prevPoints.length > 1 &&
            isPointNearPoint(point, prevPoints[0], 10, zoomLevel)
          ) {
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
            if (isPointNearPoint(point, annotation.points[j], 10, zoomLevel)) {
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
                  annotation.points[1],
                  5,
                  zoomLevel
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
    [mode, getRelativeCoordinates, zoomLevel]
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
    if (!imageElement || containerWidth === 0 || containerHeight === 0) {
      return {
        imageWidth: imageNaturalWidth,
        imageHeight: imageNaturalHeight,
        annotations: [],
        metadata: {
          timestamp: Date.now(),
          version: "1.0.0",
          exportDate: new Date().toISOString(),
        },
      };
    }

    const currentUnscaledWidth = containerWidth;
    const currentUnscaledHeight = containerHeight;

    const currentAnnotations = annotationsRef.current;

    const exportedAnnotations = currentAnnotations.map((annotation) => {
      const exportedPoints = annotation.points.map((point) => {
        const pixelCoordinates = calculateScaledPoint(
          point,
          imageNaturalWidth,
          imageNaturalHeight,
          currentUnscaledWidth,
          currentUnscaledHeight
        );

        const normalizedCoordinates = {
          x: pixelCoordinates.x / imageNaturalWidth,
          y: pixelCoordinates.y / imageNaturalHeight,
        };

        normalizedCoordinates.x = Math.max(
          0,
          Math.min(1, normalizedCoordinates.x)
        );
        normalizedCoordinates.y = Math.max(
          0,
          Math.min(1, normalizedCoordinates.y)
        );

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
  }, [
    imageElement,
    imageNaturalWidth,
    imageNaturalHeight,
    containerWidth,
    containerHeight,
  ]);

  const exportAnnotationsAsImage = useCallback((): string => {
    if (!imageElement || containerWidth === 0 || containerHeight === 0)
      return "";

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

    const currentUnscaledWidth = containerWidth;
    const currentUnscaledHeight = containerHeight;

    currentAnnotations.forEach((annotation) => {
      const scaledPoints = annotation.points.map((point) =>
        calculateScaledPoint(
          point,
          imageNaturalWidth,
          imageNaturalHeight,
          currentUnscaledWidth,
          currentUnscaledHeight
        )
      );

      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      if (annotation.type === AnnotationType.POLYGON) {
        if (scaledPoints.length < 3) return;
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
          const headLength = 15;

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

    return canvas.toDataURL("image/png");
  }, [
    imageElement,
    imageNaturalWidth,
    imageNaturalHeight,
    containerWidth,
    containerHeight,
  ]);

  const completePolygon = useCallback(() => {
    if (mode === AnnotationMode.POLYGON && tempPoints.length >= 3) {
      const newPolygonAnnotation = createPolygonAnnotation(tempPoints);
      setAnnotations((prev) => [...prev, newPolygonAnnotation]);

      setTempPoints([]);
    }
  }, [mode, tempPoints]);

  const clearAllAnnotations = useCallback(() => {
    setAnnotations([]);
    setTempPoints([]);
    setSelectedAnnotation(null);
    setSelectedPointIndex(null);

    if (currentImageKey) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentImageKey}`);
    }
  }, [currentImageKey]);

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
    clearAllAnnotations,
    getRelativeCoordinates,
  };
};
