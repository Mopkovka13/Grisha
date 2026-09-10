import { useEffect, useState } from 'react'

/**
 * Touch device — no hover, coarse pointer.
 *
 * Deliberately NOT a width breakpoint: rotating a phone crosses any width
 * threshold (390 → 844 on an iPhone), and this flag decides which element
 * scrolls. Flipping it swaps `<SimpleBar>` for a fragment in `Scroller`, which
 * remounts the whole page — losing the scroll position and every bit of
 * component state, an open video modal included.
 *
 * Layout that really is about width keeps using the CSS `max-width` queries.
 */
export const TOUCH_QUERY = '(hover: none) and (pointer: coarse)'

export function useIsTouchViewport(): boolean {
  const [isTouch, setIsTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(TOUCH_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(TOUCH_QUERY)
    const handleChange = () => setIsTouch(mql.matches)

    handleChange()
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isTouch
}
