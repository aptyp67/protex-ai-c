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

interface ImageUploaderProps {
  imageUrl: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  isMaxZoom: boolean;
  isMinZoom: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  handleFileUpload,
  zoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  isMaxZoom,
  isMinZoom,
}) => {
  return (
    <div className="image-uploader">
      {imageUrl && (
        <ZoomControls
          zoomLevel={zoomLevel}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          isMaxZoom={isMaxZoom}
          isMinZoom={isMinZoom}
        />
      )}
      <div className="upload-controls">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          id="image-upload"
        />
        <label htmlFor="image-upload" className="upload-button">
          {imageUrl ? "Change Image" : "Upload Image"}
        </label>
      </div>
    </div>
  );
};

export default ImageUploader;
