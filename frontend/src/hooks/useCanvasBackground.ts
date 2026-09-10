import { useEffect } from 'react'

/**
 * Paints the browser canvas — the area the page bleeds into behind the notch
 * and in the rubber-band overscroll at either end of a mobile page.
 * Set it to the colour of the page's own top/bottom edge so the seam is invisible.
 */
export function useCanvasBackground(color: string) {
  useEffect(() => {
    const { style } = document.documentElement
    const previous = style.backgroundColor
    style.backgroundColor = color
    return () => {
      style.backgroundColor = previous
    }
  }, [color])
}
