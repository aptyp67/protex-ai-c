import { useCallback } from "react";
import { Annotation } from "../../types";
import { generateImageKey } from "../../utils/annotation";
import { STORAGE_KEY_PREFIX, StoredAnnotations } from "./types";

interface UseImageHandlingProps {
  fileName: string | null;
  setImageElement: React.Dispatch<React.SetStateAction<HTMLImageElement | null>>;
  setImageNaturalWidth: React.Dispatch<React.SetStateAction<number>>;
  setImageNaturalHeight: React.Dispatch<React.SetStateAction<number>>;
  setCurrentImageKey: React.Dispatch<React.SetStateAction<string | null>>;
  setLoadedImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  skipSavingRef: React.MutableRefObject<boolean>;
}

interface UseImageHandlingReturn {
  handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  clearAllAnnotations: (currentImageKey: string | null) => void;
}

export const useImageHandling = ({
  fileName,
  setImageElement,
  setImageNaturalWidth,
  setImageNaturalHeight,
  setCurrentImageKey,
  setLoadedImageUrl,
  setAnnotations,
  skipSavingRef,
}: UseImageHandlingProps): UseImageHandlingReturn => {
  // Load image and restore annotations from localStorage
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      setImageElement(img);
      setImageNaturalWidth(naturalWidth);
      setImageNaturalHeight(naturalHeight);

      // Generate a unique key for storing annotations based on image properties
      // This allows us to restore annotations when the same image is loaded again
      let imageKey;
      if (fileName) {
        imageKey = `${fileName}_${naturalWidth}x${naturalHeight}`;
      } else {
        imageKey = generateImageKey(img.src, naturalWidth, naturalHeight);
      }

      console.log("Using storage key:", imageKey);
      setCurrentImageKey(imageKey);

      try {
        const storedData = localStorage.getItem(
          `${STORAGE_KEY_PREFIX}${imageKey}`
        );
        if (storedData) {
          const parsedData: StoredAnnotations = JSON.parse(storedData);

          // Only restore annotations if the image dimensions match
          // This prevents issues with scaled or different versions of images
          if (
            parsedData.naturalWidth === naturalWidth &&
            parsedData.naturalHeight === naturalHeight
          ) {
            skipSavingRef.current = true;
            setAnnotations(parsedData.annotations);
            console.log(
              "Loaded annotations from localStorage:",
              parsedData.annotations.length
            );
          } else {
            console.log(
              "Image dimensions do not match stored dimensions, resetting annotations"
            );
            setAnnotations([]);
          }
        } else {
          console.log("No stored annotations found for this image");
          setAnnotations([]);
        }
      } catch (error) {
        console.error("Error loading annotations from localStorage:", error);
        setAnnotations([]);
      }

      setLoadedImageUrl(img.src);
    },
    [fileName, setImageElement, setImageNaturalWidth, setImageNaturalHeight, 
      setCurrentImageKey, setAnnotations, setLoadedImageUrl, skipSavingRef]
  );

  // Clear all annotations for the current image
  const clearAllAnnotations = useCallback((currentImageKey: string | null) => {
    setAnnotations([]);
    
    if (currentImageKey) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentImageKey}`);
    }
  }, [setAnnotations]);

  return {
    handleImageLoad,
    clearAllAnnotations,
  };
};