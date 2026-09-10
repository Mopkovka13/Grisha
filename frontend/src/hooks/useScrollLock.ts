import { useEffect } from 'react'

/**
 * Freezes the page behind a full-screen overlay. The document is the scroller
 * on mobile, so without this the page happily scrolls under an open sheet or
 * video modal.
 *
 * Pins the body instead of setting `overflow: hidden` on it — that would make
 * the body a scroll container, which on iOS kills momentum and knocks
 * `position: fixed` children (the sheet, the modal's own controls) out of place.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const { style } = document.body
    const y = window.scrollY
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
    }

    style.position = 'fixed'
    style.top = `-${y}px`
    style.left = '0'
    style.right = '0'

    return () => {
      Object.assign(style, previous)
      window.scrollTo(0, y)
    }
  }, [active])
}
