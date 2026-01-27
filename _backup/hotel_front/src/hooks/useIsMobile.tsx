import { useEffect, useState, useRef, useCallback } from "react";

export const useIsMobile = (breakpoint = 640): boolean => {

  const [isMobile, setIsMobile] = useState(false);

  const stateRef = useRef(isMobile);

  const setRefState = (data: boolean): void => {
    stateRef.current = data;
    setIsMobile(data);
  };

  const isMobileCbk = useCallback(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < breakpoint && !stateRef.current) {
        setRefState(true);
      } else if (window.innerWidth > breakpoint && !!stateRef.current) {
        setRefState(false);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", isMobileCbk);
    return () => window.removeEventListener("resize", isMobileCbk);
  }, []);

  return isMobile;
};
