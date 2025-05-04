import React, { useRef, useEffect } from "react";
import { Annotation, AnnotationType, Point, AnnotationMode } from "../types";
import { calculateArrowHead } from "../utils/annotation";

interface AnnotationCanvasProps {
  containerWidth: number;
  containerHeight: number;
  annotations: Annotation[];
  tempPoints: Point[];
  selectedAnnotation: Annotation | null;
  className?: string;
  currentMousePosition?: Point | null;
  mode: AnnotationMode;
  zoomLevel: number;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  containerWidth,
  containerHeight,
  annotations,
  tempPoints,
  selectedAnnotation,
  className,
  currentMousePosition,
  mode,
  zoomLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // This effect redraws the canvas whenever any of its dependencies change
  // Canvas is drawn on top of the image as an overlay with transparent background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0 || containerHeight === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const handleSize = 5;

    // Draw all completed annotations
    annotations.forEach((annotation) => {
      const isSelected = selectedAnnotation?.id === annotation.id;

      // Change color for selected annotations to provide visual feedback
      ctx.strokeStyle = isSelected ? "#ff0000" : "#00ff00";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = isSelected
        ? "rgba(255, 0, 0, 0.2)"
        : "rgba(0, 255, 0, 0.2)";

      if (annotation.type === AnnotationType.POLYGON) {
        if (annotation.points.length < 3) return;

        const pointsToDraw = annotation.points;

        // Draw the polygon path
        ctx.beginPath();
        ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);

        pointsToDraw.slice(1).forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw control points for selected polygons
        if (isSelected) {
          pointsToDraw.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, handleSize, 0, Math.PI * 2);
            ctx.fillStyle = "#ff0000";
            ctx.fill();
          });
        }
      } else if (annotation.type === AnnotationType.ARROW) {
        if (annotation.points.length !== 2) return;

        const [start, end] = annotation.points;

        // Draw arrow line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        const headPoints = calculateArrowHead(start, end, 10);
        ctx.beginPath();
        ctx.moveTo(headPoints[0].x, headPoints[0].y);
        ctx.lineTo(headPoints[1].x, headPoints[1].y);
        ctx.moveTo(headPoints[0].x, headPoints[0].y);
        ctx.lineTo(headPoints[2].x, headPoints[2].y);
        ctx.stroke();

        // Draw control points for selected arrows
        if (isSelected) {
          [start, end].forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, handleSize, 0, Math.PI * 2);
            ctx.fillStyle = "#ff0000";
            ctx.fill();
          });
        }
      }
    });

    // Draw in-progress annotations (points that are being placed but not yet completed)
    if (tempPoints.length > 0) {
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;

      const pointsToDraw = tempPoints;

      ctx.beginPath();
      ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);

      pointsToDraw.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      // Show a "preview" line from the last placed point to the current mouse position
      // This gives visual feedback while creating annotations
      if (currentMousePosition && tempPoints.length > 0) {
        const mouseX = currentMousePosition.x;
        const mouseY = currentMousePosition.y;

        if (mode === AnnotationMode.POLYGON) {
          ctx.lineTo(mouseX, mouseY);
        } else if (mode === AnnotationMode.ARROW && tempPoints.length === 1) {
          ctx.lineTo(mouseX, mouseY);
        }
      }

      ctx.stroke();

      // Draw temporary control points
      pointsToDraw.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00ffff";
        ctx.fill();
      });
    }
  }, [
    containerWidth,
    containerHeight,
    annotations,
    tempPoints,
    selectedAnnotation,
    currentMousePosition,
    mode,
    zoomLevel,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth}
      height={containerHeight}
      className={`annotation-canvas ${className || ""}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none", // Important: lets mouse events pass through to the image underneath
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
      }}
    />
  );
};

export default AnnotationCanvas;
