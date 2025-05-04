import { useCallback, useRef } from "react";
import { Annotation, ExportedAnnotations } from "../../types";
import { calculateScaledPoint } from "../../utils/annotation";

interface UseAnnotationExportProps {
  annotations: Annotation[];
  imageElement: HTMLImageElement | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  containerWidth: number;
  containerHeight: number;
}

interface UseAnnotationExportReturn {
  exportAnnotations: () => ExportedAnnotations;
  exportAnnotationsAsImage: () => string;
}

export const useAnnotationExport = ({
  annotations,
  imageElement,
  imageNaturalWidth,
  imageNaturalHeight,
  containerWidth,
  containerHeight,
}: UseAnnotationExportProps): UseAnnotationExportReturn => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Export annotations in a structured JSON format
  // Includes both pixel coordinates and normalized (0-1) coordinates
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

    // Convert relative coordinates to actual pixel coordinates and normalized coordinates
    // This makes annotations usable in various contexts regardless of image size
    const exportedAnnotations = annotations.map((annotation) => {
      const exportedPoints = annotation.points.map((point) => {
        const pixelCoordinates = calculateScaledPoint(
          point,
          imageNaturalWidth,
          imageNaturalHeight,
          currentUnscaledWidth,
          currentUnscaledHeight
        );

        // Normalize to 0-1 range for resolution independence
        const normalizedCoordinates = {
          x: pixelCoordinates.x / imageNaturalWidth,
          y: pixelCoordinates.y / imageNaturalHeight,
        };

        // Clamp values to valid range
        normalizedCoordinates.x = Math.max(0, Math.min(1, normalizedCoordinates.x));
        normalizedCoordinates.y = Math.max(0, Math.min(1, normalizedCoordinates.y));

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
    annotations,
  ]);

  // Export annotations as an image with overlays
  // Uses HTML Canvas to render the image with annotations drawn on top
  const exportAnnotationsAsImage = useCallback((): string => {
    if (!imageElement || containerWidth === 0 || containerHeight === 0)
      return "";

    // Create an offscreen canvas for rendering
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Use the image's natural dimensions for the exported image
    canvas.width = imageNaturalWidth;
    canvas.height = imageNaturalHeight;

    // Draw the original image first
    ctx.drawImage(imageElement, 0, 0, imageNaturalWidth, imageNaturalHeight);

    const currentUnscaledWidth = containerWidth;
    const currentUnscaledHeight = containerHeight;

    // Draw each annotation on top of the image
    annotations.forEach((annotation) => {
      // Scale annotation points to match the original image dimensions
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

      if (annotation.type === "polygon") {
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
      } else if (annotation.type === "arrow") {
        if (scaledPoints.length === 2) {
          const [start, end] = scaledPoints;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Draw the arrowhead
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
    annotations,
  ]);

  return {
    exportAnnotations,
    exportAnnotationsAsImage,
  };
};