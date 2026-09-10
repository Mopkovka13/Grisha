import { useEffect } from 'react'
import { getScroller, scrollEventTarget } from '../utils/scroll'

const LIGHT = '#ffffff'
const DARK = '#0a0a0a'

function setThemeColor(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
}

/**
 * Keeps `<meta name="theme-color">` matching whatever section is currently
 * under the browser chrome, so the status bar / URL bar read as part of the
 * page instead of a frame around it.
 *
 * A single value can't work on the landing page: it has dark sections at both
 * ends and white ones in the middle, so any fixed choice leaves either a
 * visible bar or an unreadable clock over part of the scroll.
 *
 * @param darkSectionIds ids of the dark-background sections, in document order.
 *                       Pass none to pin the chrome light.
 */
export function useThemeColor(darkSectionIds: string[]) {
  const key = darkSectionIds.join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []

    if (ids.length === 0) {
      setThemeColor(LIGHT)
      return () => setThemeColor(DARK)
    }

    const scroller = getScroller()
    const target = scrollEventTarget(scroller)

    const update = () => {
      // Which section covers the top edge of the viewport?
      const overDark = ids.some(id => {
        const el = document.getElementById(id)
        if (!el) return false
        const { top, bottom } = el.getBoundingClientRect()
        return top <= 0 && bottom > 0
      })
      setThemeColor(overDark ? DARK : LIGHT)
    }

    update()
    // Sections mount asynchronously (videos, categories) — re-check once laid out
    const settle = requestAnimationFrame(update)

    target.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(settle)
      target.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      setThemeColor(DARK)
    }
  }, [key])
}
