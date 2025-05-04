import { useEffect } from "react";
import { Annotation } from "../../types";
import { STORAGE_KEY_PREFIX, StoredAnnotations } from "./types";

interface UsePersistenceProps {
  annotations: Annotation[];
  currentImageKey: string | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  skipSavingRef: React.MutableRefObject<boolean>;
}

export const usePersistence = ({
  annotations,
  currentImageKey,
  imageNaturalWidth,
  imageNaturalHeight,
  skipSavingRef,
}: UsePersistenceProps): void => {
  // Save annotations to localStorage whenever they change
  // Provides persistence across page reloads
  useEffect(() => {
    if (currentImageKey && !skipSavingRef.current && annotations.length > 0) {
      const dataToStore: StoredAnnotations = {
        annotations,
        timestamp: Date.now(),
        naturalWidth: imageNaturalWidth,
        naturalHeight: imageNaturalHeight,
      };
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${currentImageKey}`,
        JSON.stringify(dataToStore)
      );
    }

    if (skipSavingRef.current) {
      skipSavingRef.current = false;
    }
  }, [annotations, currentImageKey, imageNaturalWidth, imageNaturalHeight, skipSavingRef]);
};