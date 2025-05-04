import { useCallback, useRef } from "react";
import {
  Annotation,
  AnnotationMode,
  AnnotationType,
  Point,
} from "../../types";
import {
  createPolygonAnnotation,
  createArrowAnnotation,
  isPointNearPoint,
  isPointInPolygon,
  isPointNearLine,
} from "../../utils/annotation";

interface UseAnnotationInteractionsProps {
  annotations: Annotation[];
  tempPoints: Point[];
  mode: AnnotationMode;
  selectedAnnotation: Annotation | null;
  selectedPointIndex: number | null;
  zoomLevel: number;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  setTempPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setSelectedAnnotation: React.Dispatch<React.SetStateAction<Annotation | null>>;
  setSelectedPointIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  getRelativeCoordinates: (e: React.MouseEvent<HTMLDivElement>) => Point;
}

interface UseAnnotationInteractionsReturn {
  handleImageContainerClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleImageContainerMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleImageContainerMouseUp: () => void;
  resetAnnotation: () => void;
  deleteSelectedAnnotation: () => void;
  deleteSelectedPoint: () => void;
  completePolygon: () => void;
  startDragPointRef: React.MutableRefObject<Point | null>;
}

export const useAnnotationInteractions = ({
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
}: UseAnnotationInteractionsProps): UseAnnotationInteractionsReturn => {
  // Reference for drag start point
  const startDragPointRef = useRef<Point | null>(null);
  
  // Reference to access current annotations in event handlers
  const annotationsRef = useRef<Annotation[]>(annotations);
  
  // Update reference when annotations change
  annotationsRef.current = annotations;

  // Core click handler for all annotation interactions
  // Handles different behavior based on the current mode (select, polygon, arrow)
  const handleImageContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const point = getRelativeCoordinates(e);
      const currentAnnotations = annotationsRef.current;

      if (mode === AnnotationMode.POLYGON) {
        setTempPoints((prevPoints) => {
          const newTempPoints = [...prevPoints, point];

          // Check if we're closing the polygon (clicking near first point)
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

        // First, check if user clicked on a control point
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

        // If not a control point, check if clicked inside polygon or on arrow line
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
    [
      mode,
      getRelativeCoordinates,
      zoomLevel,
      setTempPoints,
      setAnnotations,
      setSelectedAnnotation,
      setSelectedPointIndex,
      setIsDragging,
    ]
  );

  // Handle mouse movement for dragging annotations or control points
  const handleImageContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode === AnnotationMode.SELECT && startDragPointRef.current) {
        const currentPoint = getRelativeCoordinates(e);

        if (!startDragPointRef.current || !selectedAnnotation) return;

        const dx = currentPoint.x - startDragPointRef.current.x;
        const dy = currentPoint.y - startDragPointRef.current.y;

        // If a specific point is selected, move only that point
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
          // Otherwise move the entire annotation
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
      selectedAnnotation,
      selectedPointIndex,
      getRelativeCoordinates,
      setAnnotations,
    ]
  );

  const handleImageContainerMouseUp = useCallback(() => {
    setIsDragging(false);
    startDragPointRef.current = null;
  }, [setIsDragging]);

  const resetAnnotation = useCallback(() => {
    setTempPoints([]);
    setSelectedAnnotation(null);
    setSelectedPointIndex(null);
  }, [setTempPoints, setSelectedAnnotation, setSelectedPointIndex]);

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
  }, [
    selectedAnnotation,
    setAnnotations,
    setSelectedAnnotation,
    setSelectedPointIndex,
  ]);

  // Allow deleting individual points from polygons
  // Maintains minimum of 3 points for a valid polygon
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
  }, [
    selectedAnnotation,
    selectedPointIndex,
    setAnnotations,
    setSelectedPointIndex,
  ]);

  // Complete the current polygon being drawn
  const completePolygon = useCallback(() => {
    if (mode === AnnotationMode.POLYGON && tempPoints.length >= 3) {
      const newPolygonAnnotation = createPolygonAnnotation(tempPoints);
      setAnnotations((prev) => [...prev, newPolygonAnnotation]);

      setTempPoints([]);
    }
  }, [mode, tempPoints, setAnnotations, setTempPoints]);

  return {
    handleImageContainerClick,
    handleImageContainerMouseMove,
    handleImageContainerMouseUp,
    resetAnnotation,
    deleteSelectedAnnotation,
    deleteSelectedPoint,
    completePolygon,
    startDragPointRef,
  };
};