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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0 || containerHeight === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const handleSize = 5 / zoomLevel;

    annotations.forEach((annotation) => {
      const isSelected = selectedAnnotation?.id === annotation.id;

      ctx.strokeStyle = isSelected ? "#ff0000" : "#00ff00";
      ctx.lineWidth = (isSelected ? 3 : 2) / zoomLevel; 
      ctx.fillStyle = isSelected
        ? "rgba(255, 0, 0, 0.2)"
        : "rgba(0, 255, 0, 0.2)";

      if (annotation.type === AnnotationType.POLYGON) {
        if (annotation.points.length < 3) return;

        const pointsToDraw = annotation.points; 

        ctx.beginPath();
        ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);

        pointsToDraw.slice(1).forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

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

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const headPoints = calculateArrowHead(start, end, 10 / zoomLevel); 
        ctx.beginPath();
        ctx.moveTo(headPoints[0].x, headPoints[0].y);
        ctx.lineTo(headPoints[1].x, headPoints[1].y);
        ctx.moveTo(headPoints[0].x, headPoints[0].y);
        ctx.lineTo(headPoints[2].x, headPoints[2].y);
        ctx.stroke();

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

    if (tempPoints.length > 0) {
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2 / zoomLevel;

      const pointsToDraw = tempPoints; 

      ctx.beginPath();
      ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);

      pointsToDraw.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      if (currentMousePosition && tempPoints.length > 0) {
         const mouseX = currentMousePosition.x / zoomLevel;
         const mouseY = currentMousePosition.y / zoomLevel;

        if (mode === AnnotationMode.POLYGON) {
          ctx.lineTo(mouseX, mouseY);
        } else if (mode === AnnotationMode.ARROW && tempPoints.length === 1) {
          ctx.lineTo(mouseX, mouseY);
        }
      }

      ctx.stroke();

      pointsToDraw.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / zoomLevel, 0, Math.PI * 2); 
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
      className={`annotation-canvas ${className || ''}`}
      style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        pointerEvents: "none",
        width: `${containerWidth}px`, 
        height: `${containerHeight}px`,
      }}
    />
  );
};

export default AnnotationCanvas;
