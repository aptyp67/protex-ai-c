import {
  Annotation,
  AnnotationMode,
  Point,
  ExportedAnnotations,
} from "../../types";

// Props for useAnnotation hook
export interface UseAnnotationProps {
  imageUrl: string | null;
  fileName: string | null;
  containerWidth: number;
  containerHeight: number;
}

// Format for annotations stored in localStorage
export interface StoredAnnotations {
  annotations: Annotation[];
  timestamp: number;
  naturalWidth: number;
  naturalHeight: number;
}

// Return interface for the useAnnotation hook
export interface UseAnnotationReturn {
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

// State for operation history (undo/redo)
export interface AnnotationHistoryState {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  selectedPointIndex: number | null;
}

// Interface for internal annotation state
export interface AnnotationState {
  annotations: Annotation[];
  tempPoints: Point[];
  mode: AnnotationMode;
  selectedAnnotation: Annotation | null;
  selectedPointIndex: number | null;
  isDragging: boolean;
  imageElement: HTMLImageElement | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  loadedImageUrl: string | null;
  zoomLevel: number;
  currentImageKey: string | null;
  history: AnnotationHistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isMaxZoom: boolean;
  isMinZoom: boolean;
}

// Storage key prefix for localStorage
export const STORAGE_KEY_PREFIX = "protexai-annotations-";