import React from "react";

interface ExportModalProps {
  exportType: "json" | "image";
  exportedData: string;
  setIsExporting: (isExporting: boolean) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  exportType,
  exportedData,
  setIsExporting,
}) => {
  // Handles browser download of exported data
  // For JSON: creates a blob and triggers download
  // For images: directly uses the dataURL from canvas.toDataURL() 
  const handleDownload = () => {
    if (exportType === "json") {
      const blob = new Blob([exportedData], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "annotations.json";
      a.click();
      URL.revokeObjectURL(url); // Clean up to avoid memory leaks
    } else {
      // For image type, exportedData is already a data URL
      const a = document.createElement("a");
      a.href = exportedData;
      a.download = "annotated-image.png";
      a.click();
    }
  };

  return (
    <div className="export-modal">
      <div className="export-modal-content">
        <h2>Exported {exportType === "json" ? "JSON" : "Image"}</h2>
        {exportType === "json" ? (
          <pre>{exportedData}</pre>
        ) : (
          <img
            src={exportedData}
            alt="Annotated result"
            style={{ maxWidth: "100%" }}
          />
        )}
        <div className="export-modal-actions">
          <button onClick={handleDownload}>Download</button>
          <button onClick={() => setIsExporting(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;