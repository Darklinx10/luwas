'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the screen size is mobile (< 768px)
 * @returns {boolean} true if mobile, false otherwise
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      // Set initial value
      const checkMobile = () => {
          setIsMobile(window.innerWidth < 768);
      };

      checkMobile();

      // Add resize listener
      window.addEventListener('resize', checkMobile);

      return () => {
          window.removeEventListener('resize', checkMobile);
      };
  }, []);

  return isMobile;
}
