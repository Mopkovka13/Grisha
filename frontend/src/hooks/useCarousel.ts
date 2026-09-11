import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

/**
 * Matches cubic-bezier(0.22, 1, 0.36, 1) — the curve the rest of the site
 * already moves on (scroll reveal, the mobile sheet).
 */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

interface Carousel {
  canPrev: boolean
  canNext: boolean
  goPrev: () => void
  goNext: () => void
}

/**
 * Click-through navigation for a horizontally scrolling strip.
 *
 * The strip stays a plain overflow-x container, so touch keeps its native
 * swipe and momentum; this only adds the prev/next steps used by the arrows on
 * pointer devices. Nothing hijacks the wheel.
 *
 * Items have different widths, so a step is "align the next item's left edge",
 * not a fixed pixel amount.
 */
export function useCarousel(ref: RefObject<HTMLElement>, itemCount: number): Carousel {
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const anim = useRef<number | null>(null)

  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 1)
    setCanNext(max > 1 && el.scrollLeft < max - 1)
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Any real input wins over an arrow animation still in flight, otherwise
    // the two pull the strip in different directions
    const cancelAnim = () => {
      if (anim.current === null) return
      cancelAnimationFrame(anim.current)
      anim.current = null
      el.style.scrollSnapType = ''
    }

    sync()
    el.addEventListener('scroll', sync, { passive: true })
    el.addEventListener('wheel', cancelAnim, { passive: true })
    el.addEventListener('touchstart', cancelAnim, { passive: true })
    el.addEventListener('pointerdown', cancelAnim, { passive: true })
    window.addEventListener('resize', sync)

    // Items are sized from images that decode later, so the scrollable width
    // changes after mount — watch for it instead of measuring once
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    Array.from(el.children).forEach(child => observer.observe(child))

    return () => {
      el.removeEventListener('scroll', sync)
      el.removeEventListener('wheel', cancelAnim)
      el.removeEventListener('touchstart', cancelAnim)
      el.removeEventListener('pointerdown', cancelAnim)
      window.removeEventListener('resize', sync)
      observer.disconnect()
      if (anim.current !== null) cancelAnimationFrame(anim.current)
    }
    // itemCount: the strip is empty on mount and fills in once the request
    // resolves. Its own box never changes size, so without re-running here the
    // new children would go unobserved and the next arrow would stay disabled.
  }, [ref, sync, itemCount])

  /** Offset of every item within the scrollable content */
  const itemOffsets = useCallback((el: HTMLElement): number[] => {
    const stripLeft = el.getBoundingClientRect().left
    return Array.from(el.children).map(
      child => child.getBoundingClientRect().left - stripLeft + el.scrollLeft
    )
  }, [])

  /**
   * Eased scroll, in place of scrollTo({ behavior: 'smooth' }): the native
   * curve is short and uniform regardless of distance, which reads as abrupt
   * next to the rest of the site's motion. Duration grows with the distance.
   *
   * Snap is switched off for the duration — left on, the browser tries to
   * settle the strip on a snap point while the animation is still writing
   * scrollLeft every frame, and the two fight each other visibly.
   */
  const animateTo = useCallback((el: HTMLElement, to: number) => {
    if (anim.current !== null) cancelAnimationFrame(anim.current)

    const from = el.scrollLeft
    const distance = to - from
    if (Math.abs(distance) < 1) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollLeft = to
      return
    }

    const duration = Math.min(900, Math.max(420, Math.abs(distance) * 0.75))
    const start = performance.now()
    const snap = el.style.scrollSnapType
    el.style.scrollSnapType = 'none'

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      el.scrollLeft = from + distance * easeOutQuint(t)

      if (t < 1) {
        anim.current = requestAnimationFrame(frame)
      } else {
        anim.current = null
        el.style.scrollSnapType = snap
      }
    }

    anim.current = requestAnimationFrame(frame)
  }, [])

  const step = useCallback((direction: 1 | -1) => {
    const el = ref.current
    if (!el) return

    const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0
    const offsets = itemOffsets(el)
    const max = el.scrollWidth - el.clientWidth
    const current = el.scrollLeft

    // Targets are item edges aligned to the start of the visible area
    const targets = offsets.map(o => Math.max(0, Math.min(max, o - padLeft)))

    const next = direction === 1
      ? targets.find(t => t > current + 1)
      : [...targets].reverse().find(t => t < current - 1)

    animateTo(el, next ?? (direction === 1 ? max : 0))
  }, [ref, itemOffsets, animateTo])

  return {
    canPrev,
    canNext,
    goPrev: useCallback(() => step(-1), [step]),
    goNext: useCallback(() => step(1), [step]),
  }
}
