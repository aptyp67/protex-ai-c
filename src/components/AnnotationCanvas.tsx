import React, { useRef, useEffect } from "react";
import { Annotation, AnnotationType, Point, AnnotationMode } from "../types";
import { calculateArrowHead } from "../utils/annotation";

interface AnnotationCanvasProps {
  width: number;
  height: number;
  annotations: Annotation[];
  tempPoints: Point[];
  selectedAnnotation: Annotation | null;
  className?: string;
  currentMousePosition?: Point | null;
  mode: AnnotationMode;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  width,
  height,
  annotations,
  tempPoints,
  selectedAnnotation,
  className,
  currentMousePosition,
  mode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    annotations.forEach((annotation) => {
      const isSelected = selectedAnnotation?.id === annotation.id;

      ctx.strokeStyle = isSelected ? "#ff0000" : "#00ff00";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = isSelected
        ? "rgba(255, 0, 0, 0.2)"
        : "rgba(0, 255, 0, 0.2)";

      if (annotation.type === AnnotationType.POLYGON) {
        if (annotation.points.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);

        annotation.points.slice(1).forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (isSelected) {
          annotation.points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ff0000";
            ctx.fill();
          });
        }
      } else if (annotation.type === AnnotationType.ARROW) {
        if (annotation.points.length !== 2) return;

        const [start, end] = annotation.points;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const headPoints = calculateArrowHead(start, end, 10);
        ctx.beginPath();
        ctx.moveTo(headPoints[0].x, headPoints[0].y);
        ctx.lineTo(headPoints[1].x, headPoints[1].y);
        ctx.moveTo(headPoints[0].x, headPoints[0].y);
        ctx.lineTo(headPoints[2].x, headPoints[2].y);
        ctx.stroke();

        if (isSelected) {
          [start, end].forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ff0000";
            ctx.fill();
          });
        }
      }
    });

    if (tempPoints.length > 0) {
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(tempPoints[0].x, tempPoints[0].y);

      tempPoints.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      if (
        mode === AnnotationMode.POLYGON &&
        currentMousePosition &&
        tempPoints.length > 0
      ) {
        ctx.lineTo(currentMousePosition.x, currentMousePosition.y);

        if (tempPoints.length > 1) {
          ctx.lineTo(tempPoints[0].x, tempPoints[0].y);
        }
      } else if (
        mode === AnnotationMode.ARROW &&
        currentMousePosition &&
        tempPoints.length === 1
      ) {
        ctx.lineTo(currentMousePosition.x, currentMousePosition.y);
      } else if (tempPoints.length > 1) {
        ctx.lineTo(tempPoints[0].x, tempPoints[0].y);
      }

      ctx.stroke();

      tempPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00ffff";
        ctx.fill();
      });
    }
  }, [
    width,
    height,
    annotations,
    tempPoints,
    selectedAnnotation,
    currentMousePosition,
    mode,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    />
  );
};

export default AnnotationCanvas;
