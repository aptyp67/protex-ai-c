import React from "react";

interface ZoomControlsProps {
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  isMaxZoom: boolean;
  isMinZoom: boolean;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  isMaxZoom,
  isMinZoom,
}) => {
  return (
    <div className="zoom-controls-group">
      <button
        onClick={zoomOut}
        disabled={isMinZoom}
        title="Zoom Out (Ctrl+-)"
        className={isMinZoom ? "disabled" : ""}
      >
        -
      </button>
      <span className="zoom-level">
        {Math.round(zoomLevel * 100)}%{isMaxZoom && " (Max)"}
      </span>
      <button
        onClick={zoomIn}
        disabled={isMaxZoom}
        title="Zoom In (Ctrl+=)"
        className={isMaxZoom ? "disabled" : ""}
      >
        +
      </button>
      <button
        onClick={resetZoom}
        disabled={zoomLevel === 1}
        title="Reset Zoom (Ctrl+0)"
        className="reset-zoom"
      >
        Reset
      </button>
    </div>
  );
};

export default ZoomControls;