import { useEffect, RefObject } from "react";

/**
 * Hook that alerts when you click outside of the passed ref
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  exceptionalRefs: RefObject<HTMLElement | null>[] = []
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      const target = event.target as Node;

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(target)) {
        return;
      }

      // Check if clicking on exceptional elements
      for (const exceptionalRef of exceptionalRefs) {
        if (exceptionalRef.current && exceptionalRef.current.contains(target)) {
          return;
        }
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, exceptionalRefs]);
}
