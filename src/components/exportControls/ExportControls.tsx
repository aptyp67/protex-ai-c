import React from "react";

interface ExportControlsProps {
  exportType: "json" | "image";
  setExportType: (type: "json" | "image") => void;
  handleExport: () => void;
}

// Component for selecting export format and triggering export
// Per requirements, we support both JSON (with coordinates) and Image export formats
const ExportControls: React.FC<ExportControlsProps> = ({
  exportType,
  setExportType,
  handleExport,
}) => {
  return (
    <div className="export-controls">
      <div className="export-options">
        <label>
          <input
            type="radio"
            name="exportType"
            checked={exportType === "json"}
            onChange={() => setExportType("json")}
          />
          JSON
        </label>
        <label>
          <input
            type="radio"
            name="exportType"
            checked={exportType === "image"}
            onChange={() => setExportType("image")}
          />
          Image
        </label>
      </div>
      <button onClick={handleExport}>
        Export {exportType === "json" ? "JSON" : "Image"}
      </button>
    </div>
  );
};

export default ExportControls;