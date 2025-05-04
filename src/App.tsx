import { useState, useRef, useEffect } from "react";
import { AnnotationMode, Point } from "./types";
import { useAnnotation } from "./hooks/useAnnotation";

import Header from "./components/header/Header";
import ImageUploader from "./components/imageSection/ImageUploader";
import ImageContainer from "./components/imageSection/ImageContainer";
import ExportControls from "./components/exportControls/ExportControls";
import ExportModal from "./components/exportControls/ExportModal";
import Footer from "./components/Footer";

import "./App.css";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
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
    containerHeight: imageContainerDimensions.height,
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
      <Header
        mode={mode}
        setMode={setMode}
        selectedAnnotation={selectedAnnotation}
        tempPoints={tempPoints}
        completePolygon={completePolygon}
        deleteSelectedAnnotation={deleteSelectedAnnotation}
        deleteSelectedPoint={deleteSelectedPoint}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={undo}
        redo={redo}
      />

      <main className="main-content">
        <ImageUploader
          imageUrl={imageUrl}
          handleFileUpload={handleFileUpload}
          zoomLevel={zoomLevel}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          isMaxZoom={isMaxZoom}
          isMinZoom={isMinZoom}
        />

        <ImageContainer
          imageUrl={imageUrl}
          imageRef={imageRef}
          imageContainerRef={imageContainerRef}
          handleImageContainerClick={handleImageContainerClick}
          handleMouseMove={handleMouseMove}
          handleImageContainerMouseUp={handleImageContainerMouseUp}
          handleWheel={handleWheel}
          handleImageLoadAndDimensions={handleImageLoadAndDimensions}
          setUnscaledMousePosition={setUnscaledMousePosition}
          zoomLevel={zoomLevel}
          getCursorStyle={getCursorStyle}
          isDraggingFile={isDraggingFile}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          imageContainerDimensions={imageContainerDimensions}
          annotations={annotations}
          tempPoints={tempPoints}
          selectedAnnotation={selectedAnnotation}
          unscaledMousePosition={unscaledMousePosition}
          mode={mode}
        />

        {imageUrl && (
          <ExportControls
            exportType={exportType}
            setExportType={setExportType}
            handleExport={handleExport}
          />
        )}

        {isExporting && exportedData && (
          <ExportModal
            exportType={exportType}
            exportedData={exportedData}
            setIsExporting={setIsExporting}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
