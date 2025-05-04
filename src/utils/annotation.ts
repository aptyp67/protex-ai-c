import {
  AnnotationType,
  Point,
  PolygonAnnotation,
  ArrowAnnotation,
} from "../types";

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
};

export const createPolygonAnnotation = (points: Point[]): PolygonAnnotation => {
  return {
    id: generateId(),
    type: AnnotationType.POLYGON,
    points: [...points],
  };
};

export const createArrowAnnotation = (
  startPoint: Point,
  endPoint: Point
): ArrowAnnotation => {
  return {
    id: generateId(),
    type: AnnotationType.ARROW,
    points: [startPoint, endPoint],
  };
};

export const calculateScaledPoint = (
  point: Point,
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): Point => {
  return {
    x: (point.x / containerWidth) * imageWidth,
    y: (point.y / containerHeight) * imageHeight,
  };
};

export const isPointNearPoint = (
  p1: Point,
  p2: Point,
  threshold = 10
): boolean => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
};

export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

export const isPointNearLine = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  threshold = 5
): boolean => {
  const lineLength = Math.sqrt(
    Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2)
  );

  if (lineLength === 0) return isPointNearPoint(point, lineStart, threshold);

  const t =
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
    (lineLength * lineLength);

  if (t < 0) {
    return isPointNearPoint(point, lineStart, threshold);
  }

  if (t > 1) {
    return isPointNearPoint(point, lineEnd, threshold);
  }

  const closestPoint = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };

  return isPointNearPoint(point, closestPoint, threshold);
};

export const calculateAngle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

export const calculateArrowHead = (
  start: Point,
  end: Point,
  headSize: number = 10
): Point[] => {
  const angle = calculateAngle(start, end);

  return [
    end,
    {
      x: end.x - headSize * Math.cos(angle - Math.PI / 6),
      y: end.y - headSize * Math.sin(angle - Math.PI / 6),
    },
    {
      x: end.x - headSize * Math.cos(angle + Math.PI / 6),
      y: end.y - headSize * Math.sin(angle + Math.PI / 6),
    },
  ];
};

export const findSelectedPointIndex = (
  points: Point[],
  mousePoint: Point,
  threshold: number = 10
): number => {
  for (let i = 0; i < points.length; i++) {
    if (isPointNearPoint(points[i], mousePoint, threshold)) {
      return i;
    }
  }
  return -1;
};
