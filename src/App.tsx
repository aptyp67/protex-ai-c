import { useState, useRef, useEffect } from "react";
import AnnotationCanvas from "./components/AnnotationCanvas";
import { useAnnotation } from "./hooks/useAnnotation";
import { AnnotationMode, AnnotationType, Point } from "./types";
import "./App.css";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedData, setExportedData] = useState<string | null>(null);
  const [exportType, setExportType] = useState<"json" | "image">("json");
  const [unscaledMousePosition, setUnscaledMousePosition] =
    useState<Point | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const [imageContainerDimensions, setImageContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

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
    deleteSelectedPoint,
    exportAnnotations,
    exportAnnotationsAsImage,
    undo,
    redo,
    canUndo,
    canRedo,
    completePolygon,
    isDragging,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    isMaxZoom,
    isMinZoom,
    getRelativeCoordinates,
  } = useAnnotation({ 
    imageUrl, 
    fileName, 
    containerWidth: imageContainerDimensions.width,
    containerHeight: imageContainerDimensions.height 
  });

  useEffect(() => {
    const currentImageRef = imageRef.current;

    const updateDimensions = () => {
      if (currentImageRef) {
        const img = currentImageRef;
        setImageContainerDimensions({
          width: img.offsetWidth,
          height: img.offsetHeight,
        });
      } else {
        setImageContainerDimensions({ width: 0, height: 0 });
      }
    };

    updateDimensions();

    window.addEventListener("resize", updateDimensions);

    let resizeObserver: ResizeObserver | null = null;
    if (currentImageRef) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(currentImageRef);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      if (resizeObserver && currentImageRef) {
        resizeObserver.unobserve(currentImageRef);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [imageUrl, zoomLevel]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    const newImageUrl = URL.createObjectURL(file);
    setFileName(file.name);
    setImageUrl(newImageUrl);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      }
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
    const pos = getRelativeCoordinates(e); 
    setUnscaledMousePosition(pos);

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
      if (e.key === "Enter") {
        if (mode === AnnotationMode.POLYGON && tempPoints.length >= 3) {
          e.preventDefault();
          completePolygon();
        } else if (mode === AnnotationMode.SELECT && isDragging) {
          e.preventDefault();
          handleImageContainerMouseUp();
          resetAnnotation();
        }
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

      if ((e.ctrlKey || e.metaKey) && e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
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
    completePolygon,
    mode,
    tempPoints,
    isDragging,
    handleImageContainerMouseUp,
    zoomIn,
    zoomOut,
    resetZoom,
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

  const handleImageLoadAndDimensions = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    handleImageLoad(e);
    const img = e.currentTarget;
    setImageContainerDimensions({
      width: img.offsetWidth,
      height: img.offsetHeight,
    });
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
      </header>

      <main className="main-content">
        <div className="image-uploader">
          {imageUrl && (
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

        <div
          className={`image-container-wrapper ${
            isDraggingFile ? "dragging" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            ref={imageContainerRef}
            className="image-container"
            onClick={handleImageContainerClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleImageContainerMouseUp}
            onMouseLeave={() => {
              setUnscaledMousePosition(null); 
              handleImageContainerMouseUp();
            }}
            onWheel={handleWheel}
            style={{
              ...getCursorStyle(),
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top left",
            }}
          >
            {imageUrl && (
              <>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Uploaded for annotation"
                  onLoad={handleImageLoadAndDimensions}
                  draggable={false} 
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                  }}
                />
                <AnnotationCanvas
                  containerWidth={imageContainerDimensions.width}
                  containerHeight={imageContainerDimensions.height}
                  annotations={annotations}
                  tempPoints={tempPoints}
                  selectedAnnotation={selectedAnnotation}
                  currentMousePosition={unscaledMousePosition} 
                  mode={mode}
                  zoomLevel={zoomLevel}
                />
              </>
            )}
            {!imageUrl && (
              <div className="placeholder">
                <p>Please upload an image to start annotating</p>
                <p className="drag-drop-placeholder">
                  {isDraggingFile ? (
                    "Drop image here"
                  ) : (
                    <>
                      <br />
                      or drag and drop an image here
                    </>
                  )}
                </p>
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
          <strong>Instructions:</strong> Upload an image using the button or
          drag-and-drop. Select a mode (Polygon/Arrow), click on the image to
          create annotations. Use Select mode to edit or move annotations.
          Select a point and press Delete key or use Delete Point button to
          remove individual polygon points. Press Enter to complete a polygon or
          to finish moving an object. Use zoom controls or Ctrl+mouse wheel to
          zoom in and out.
        </p>
      </footer>
    </div>
  );
}

export default App;
