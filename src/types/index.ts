export enum AnnotationType {
  POLYGON = "polygon",
  ARROW = "arrow",
}

export enum AnnotationMode {
  SELECT = "select",
  POLYGON = "polygon",
  ARROW = "arrow",
}

export interface Point {
  x: number;
  y: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  points: Point[];
}

export interface PolygonAnnotation extends Annotation {
  type: AnnotationType.POLYGON;
}

export interface ArrowAnnotation extends Annotation {
  type: AnnotationType.ARROW;
  points: [Point, Point];
}

export interface ExportedPoint {
  pixelCoordinates: Point;
  normalizedCoordinates: NormalizedPoint;
}

export interface ExportedAnnotation {
  id: string;
  type: AnnotationType;
  points: ExportedPoint[];
}

export interface ExportedAnnotations {
  imageWidth: number;
  imageHeight: number;
  annotations: ExportedAnnotation[];
  metadata?: {
    timestamp: number;
    version: string;
    exportDate: string;
  };
}
