import { useCallback } from "react";
import { Point } from "../../types";

interface UseZoomReturn {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  getRelativeCoordinates: (e: React.MouseEvent<HTMLDivElement>) => Point;
}

export const useZoom = (
  zoomLevel: number,
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>
): UseZoomReturn => {
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 2));
  }, [setZoomLevel]);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.2));
  }, [setZoomLevel]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, [setZoomLevel]);

  // Handle mouse wheel events for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY || e.deltaX;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        setZoomLevel((prevZoom) => {
          const newZoom = prevZoom * zoomFactor;
          return Math.min(Math.max(newZoom, 0.2), 2);
        });
      }
    },
    [setZoomLevel]
  );

  // Convert mouse coordinates to image-relative coordinates
  // This is critical for accurate annotation placement regardless of zoom level
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

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    getRelativeCoordinates,
  };
};