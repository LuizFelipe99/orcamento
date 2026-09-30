import { useEffect, useState } from 'react';

export type ViewportSize = {
  width: number;
  height: number;
};

const readViewportSize = (): ViewportSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export const useViewportSize = (): ViewportSize => {
  const [viewportSize, setViewportSize] = useState(readViewportSize);

  useEffect(() => {
    const updateViewportSize = () => setViewportSize(readViewportSize());

    window.addEventListener('resize', updateViewportSize);

    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  return viewportSize;
};
