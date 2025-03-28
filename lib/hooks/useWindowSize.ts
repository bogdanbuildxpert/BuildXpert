import { useState, useEffect } from "react";

interface WindowSize {
  width: number;
  height: number;
}

/**
 * A hook that returns the current window dimensions and updates when the window is resized.
 * This is useful for responsive layouts and virtualized lists.
 *
 * @param debounceMs Optional debounce delay in milliseconds (default: 100)
 * @returns An object containing the current window width and height
 */
export function useWindowSize(debounceMs = 100): WindowSize {
  // Initialize with default values to prevent hydration mismatch errors
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Function to update state with window dimensions
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateSize();

    // Create debounced version of updateSize
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdateSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, debounceMs);
    };

    // Add event listener with debounced handler
    window.addEventListener("resize", debouncedUpdateSize);

    // Clean up on unmount
    return () => {
      window.removeEventListener("resize", debouncedUpdateSize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]); // Only re-run if debounce value changes

  return windowSize;
}
