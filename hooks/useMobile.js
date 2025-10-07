// hooks/useIsMobile.js
import { useEffect, useState } from "react";

// match Tailwind breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export default function useIsMobile(breakpoint = "md") {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const bp = breakpoints[breakpoint] ?? breakpoints.md;

    const checkSize = () => setIsMobile(window.innerWidth < bp);
    checkSize();

    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [breakpoint]);

  return isMobile;
}
