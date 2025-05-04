import { useState, useRef, useEffect } from "react";
import AnnotationCanvas from "./components/AnnotationCanvas";
import { useAnnotation } from "./hooks/useAnnotation";
import { AnnotationMode, Point } from "./types";
import "./App.css";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedData, setExportedData] = useState<string | null>(null);
  const [exportType, setExportType] = useState<"json" | "image">("json");
  const [currentMousePosition, setCurrentMousePosition] =
    useState<Point | null>(null);

  const {
    annotations,
    tempPoints,
    mode,
    selectedAnnotation,
    handleImageContainerClick,
    handleImageContainerMouseMove,
    handleImageContainerMouseUp,
    handleImageLoad,
    setMode,
    resetAnnotation,
    deleteSelectedAnnotation,
    exportAnnotations,
    exportAnnotationsAsImage,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAnnotation({ imageUrl });

  useEffect(() => {
    const updateDimensions = () => {
      if (imageContainerRef.current) {
        const { clientWidth, clientHeight } = imageContainerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [imageUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const newImageUrl = URL.createObjectURL(file);
      setImageUrl(newImageUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleExport = () => {
    setIsExporting(true);
    if (exportType === "json") {
      const data = exportAnnotations();
      setExportedData(JSON.stringify(data, null, 2));
    } else {
      const dataUrl = exportAnnotationsAsImage();
      setExportedData(dataUrl);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    setCurrentMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    handleImageContainerMouseMove(e);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAnnotation) {
          deleteSelectedAnnotation();
        }
      }
      if (e.key === "Escape") {
        resetAnnotation();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (canUndo) undo();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedAnnotation,
    deleteSelectedAnnotation,
    resetAnnotation,
    canUndo,
    canRedo,
    undo,
    redo,
  ]);

  const getCursorStyle = (): React.CSSProperties => {
    if (!imageUrl) return {};

    switch (mode) {
      case AnnotationMode.POLYGON:
        return { cursor: "crosshair" };
      case AnnotationMode.ARROW:
        return { cursor: "crosshair" };
      case AnnotationMode.SELECT:
        return { cursor: "pointer" };
      default:
        return { cursor: "default" };
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Image Annotation Tool</h1>
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
          <button onClick={resetAnnotation} disabled={tempPoints.length === 0}>
            Cancel
          </button>
          <button
            onClick={deleteSelectedAnnotation}
            disabled={!selectedAnnotation}
          >
            Delete
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
      </header>

      <main className="main-content">
        <div className="image-uploader">
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

        <div className="image-container-wrapper">
          <div
            ref={imageContainerRef}
            className="image-container"
            onClick={handleImageContainerClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleImageContainerMouseUp}
            onMouseLeave={() => {
              setCurrentMousePosition(null);
              handleImageContainerMouseUp();
            }}
            style={getCursorStyle()}
          >
            {imageUrl && (
              <>
                <img
                  src={imageUrl}
                  alt="Uploaded for annotation"
                  onLoad={handleImageLoad}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  draggable="false"
                />
                <AnnotationCanvas
                  width={containerDimensions.width}
                  height={containerDimensions.height}
                  annotations={annotations}
                  tempPoints={tempPoints}
                  selectedAnnotation={selectedAnnotation}
                  currentMousePosition={currentMousePosition}
                  mode={mode}
                />
              </>
            )}
            {!imageUrl && (
              <div className="placeholder">
                <p>Please upload an image to start annotating</p>
              </div>
            )}
          </div>
        </div>

        {imageUrl && (
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
        )}

        {isExporting && exportedData && (
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
                <button
                  onClick={() => {
                    if (exportType === "json") {
                      const blob = new Blob([exportedData], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "annotations.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      const a = document.createElement("a");
                      a.href = exportedData;
                      a.download = "annotated-image.png";
                      a.click();
                    }
                  }}
                >
                  Download
                </button>
                <button onClick={() => setIsExporting(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Image Annotation Tool - Home assignment for ProtexAI</p>
        <p className="instructions">
          <strong>Instructions:</strong> Select a mode (Polygon/Arrow), click on
          the image to create annotations. Use Select mode to edit or move
          annotations.
        </p>
      </footer>
    </div>
  );
}

export default App;
