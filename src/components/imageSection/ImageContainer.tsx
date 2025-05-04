import React, { RefObject } from "react";
import { Point, AnnotationMode, Annotation } from "../../types";
import AnnotationCanvas from "../AnnotationCanvas";

interface ImageContainerProps {
  imageUrl: string | null;
  imageRef: RefObject<HTMLImageElement | null>;
  imageContainerRef: RefObject<HTMLDivElement | null>;
  handleImageContainerClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleImageContainerMouseUp: () => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  handleImageLoadAndDimensions: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  setUnscaledMousePosition: React.Dispatch<React.SetStateAction<Point | null>>;
  zoomLevel: number;
  getCursorStyle: () => React.CSSProperties;
  isDraggingFile: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  imageContainerDimensions: { width: number; height: number };
  annotations: Annotation[];
  tempPoints: Point[];
  selectedAnnotation: Annotation | null;
  unscaledMousePosition: Point | null;
  mode: AnnotationMode;
}

// This component handles both the image display and the annotation interactions
// It's a critical component that serves as the main work area for creating annotations
const ImageContainer: React.FC<ImageContainerProps> = ({
  imageUrl,
  imageRef,
  imageContainerRef,
  handleImageContainerClick,
  handleMouseMove,
  handleImageContainerMouseUp,
  handleWheel,
  handleImageLoadAndDimensions,
  setUnscaledMousePosition,
  zoomLevel,
  getCursorStyle,
  isDraggingFile,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  imageContainerDimensions,
  annotations,
  tempPoints,
  selectedAnnotation,
  unscaledMousePosition,
  mode
}) => {
  return (
    <div
      className={`image-container-wrapper ${isDraggingFile ? "dragging" : ""}`}
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
          // Important to clear mouse position and stop dragging when mouse leaves the container
          // Prevents weird behavior when mouse returns to container
          setUnscaledMousePosition(null);
          handleImageContainerMouseUp();
        }}
        onWheel={handleWheel}
        style={{
          ...getCursorStyle(),
          // Transform scale is applied to the container instead of individual elements
          // This ensures all child elements (image and annotations) zoom together
          transform: `scale(${zoomLevel})`,
          transformOrigin: "center center",
        }}
      >
        {imageUrl && (
          <>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Uploaded for annotation"
              onLoad={handleImageLoadAndDimensions}
              draggable={false} // Prevents browser's default drag behavior
              style={{
                display: "block",
                width: "100%",
                height: "100%",
              }}
            />
            {/* Canvas is positioned absolutely on top of the image */}
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
        {!imageUrl && <EmptyPlaceholder isDraggingFile={isDraggingFile} />}
      </div>
    </div>
  );
};

interface EmptyPlaceholderProps {
  isDraggingFile: boolean;
}

// Simple placeholder shown when no image is loaded
// Changes appearance when a file is being dragged over
const EmptyPlaceholder: React.FC<EmptyPlaceholderProps> = ({ isDraggingFile }) => {
  return (
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
  );
};

export default ImageContainer;