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
          setUnscaledMousePosition(null);
          handleImageContainerMouseUp();
        }}
        onWheel={handleWheel}
        style={{
          ...getCursorStyle(),
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
        {!imageUrl && <EmptyPlaceholder isDraggingFile={isDraggingFile} />}
      </div>
    </div>
  );
};

interface EmptyPlaceholderProps {
  isDraggingFile: boolean;
}

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