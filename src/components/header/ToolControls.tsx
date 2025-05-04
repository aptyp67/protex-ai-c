import React from "react";
import { AnnotationMode, AnnotationType, Annotation } from "../../types";

interface ToolControlsProps {
  mode: AnnotationMode;
  setMode: (mode: AnnotationMode) => void;
  selectedAnnotation: Annotation | null;
  tempPoints: { x: number; y: number }[];
  completePolygon: () => void;
  deleteSelectedAnnotation: () => void;
  deleteSelectedPoint: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

const ToolControls: React.FC<ToolControlsProps> = ({
  mode,
  setMode,
  selectedAnnotation,
  tempPoints,
  completePolygon,
  deleteSelectedAnnotation,
  deleteSelectedPoint,
  canUndo,
  canRedo,
  undo,
  redo,
}) => {
  return (
    <div className="tool-controls">
      <button
        className={mode === AnnotationMode.SELECT ? "active" : ""}
        onClick={() => setMode(AnnotationMode.SELECT)}
      >
        Select
      </button>
      <button
        className={mode === AnnotationMode.POLYGON ? "active" : ""}
        onClick={() => setMode(AnnotationMode.POLYGON)}
      >
        Polygon
      </button>
      <button
        className={mode === AnnotationMode.ARROW ? "active" : ""}
        onClick={() => setMode(AnnotationMode.ARROW)}
      >
        Arrow
      </button>
      {mode === AnnotationMode.POLYGON && tempPoints.length >= 3 && (
        <button onClick={completePolygon} className="finish-button">
          Finish Polygon (or Press Enter)
        </button>
      )}

      <button
        onClick={deleteSelectedAnnotation}
        disabled={!selectedAnnotation}
      >
        Delete Annotation
      </button>

      <button
        onClick={deleteSelectedPoint}
        disabled={
          !selectedAnnotation ||
          !(
            selectedAnnotation.type === AnnotationType.POLYGON &&
            selectedAnnotation.points.length > 3
          )
        }
        title="Delete selected point (works when a point is selected and polygon has more than 3 points)"
      >
        Delete Point
      </button>

      <div className="history-controls">
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          Redo
        </button>
      </div>
    </div>
  );
};

export default ToolControls;