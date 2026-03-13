import { useEffect, useRef } from 'react'

/**
 * Smooth scroll with curved easing: slow start → gentle acceleration → smooth deceleration.
 * Uses lerp with a ramping factor — low at the beginning (smooth entry),
 * climbs to full value (acceleration), and decelerates naturally near the target.
 * Snap-to-section for Hero (top) and Contacts.
 * Works alongside SimpleBar — only intercepts wheel; scrollbar drag stays native.
 */
export function useCurveScroll() {
  const state = useRef({
    target: 0,
    current: 0,
    rafId: null as number | null,
    running: false,
    lastWheel: 0,
    lastProgrammatic: 0,
    rampStart: 0,
    snapTimer: null as ReturnType<typeof setTimeout> | null,
  })

  useEffect(() => {
    const scrollEl = document.querySelector('.simplebar-content-wrapper') as HTMLElement
    if (!scrollEl) return

    const s = state.current

    // Lerp ramp parameters
    const LERP_MIN = 0.035          // initial slow lerp (smooth start)
    const LERP_MAX = 0.11           // full lerp after ramp (acceleration)
    const RAMP_MS = 280             // time to reach full lerp
    const SETTLE_THRESHOLD = 0.5    // px — stop animating below this

    // Snap
    const SNAP_ZONE = 130           // px from snap point to trigger
    const SNAP_IDLE = 200           // ms of inactivity before snap check

    s.current = scrollEl.scrollTop
    s.target = scrollEl.scrollTop

    const maxScroll = () => scrollEl.scrollHeight - scrollEl.clientHeight

    /** Element's scroll position relative to the scroll container */
    const elementScrollTop = (el: HTMLElement): number => {
      const elRect = el.getBoundingClientRect()
      const containerRect = scrollEl.getBoundingClientRect()
      return scrollEl.scrollTop + elRect.top - containerRect.top
    }

    const getSnapPoints = (): number[] => {
      const points: number[] = [0]
      const contacts = document.getElementById('contacts')
      if (contacts) points.push(elementScrollTop(contacts))
      return points
    }

    const trySnap = () => {
      const snapPoints = getSnapPoints()
      for (const point of snapPoints) {
        if (Math.abs(s.current - point) < SNAP_ZONE) {
          s.target = point
          s.rampStart = Date.now()
          startLoop()
          return
        }
      }
    }

    /** Compute current lerp factor: ramps from LERP_MIN → LERP_MAX over RAMP_MS */
    const getLerp = (): number => {
      const elapsed = Date.now() - s.rampStart
      const t = Math.min(elapsed / RAMP_MS, 1)
      // Quadratic ease-in ramp: slow start, then picks up speed
      const ramp = t * t
      return LERP_MIN + (LERP_MAX - LERP_MIN) * ramp
    }

    const tick = () => {
      const lerp = getLerp()
      const diff = s.target - s.current

      s.current += diff * lerp

      // Clamp
      const max = maxScroll()
      if (s.current < 0) s.current = 0
      if (s.current > max) s.current = max

      s.lastProgrammatic = Date.now()
      scrollEl.scrollTop = Math.round(s.current * 100) / 100

      if (Math.abs(s.target - s.current) > SETTLE_THRESHOLD) {
        s.rafId = requestAnimationFrame(tick)
      } else {
        // Settled
        s.current = s.target
        scrollEl.scrollTop = s.current
        s.running = false
      }
    }

    const startLoop = () => {
      if (!s.running) {
        s.running = true
        s.rafId = requestAnimationFrame(tick)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const now = Date.now()

      // If this is a fresh scroll gesture (>200ms gap), reset the ramp
      if (now - s.lastWheel > 200) {
        s.rampStart = now
      }

      s.lastWheel = now

      // Sync from scrollbar drag if not animating
      if (!s.running) {
        s.current = scrollEl.scrollTop
        s.target = scrollEl.scrollTop
      }

      const max = maxScroll()
      s.target = Math.max(0, Math.min(max, s.target + e.deltaY))

      startLoop()

      // Schedule snap check after inactivity
      if (s.snapTimer) clearTimeout(s.snapTimer)
      s.snapTimer = setTimeout(() => {
        if (Date.now() - s.lastWheel >= SNAP_IDLE) {
          trySnap()
        }
      }, SNAP_IDLE)
    }

    /** Keep state in sync when user drags the SimpleBar scrollbar */
    const handleScroll = () => {
      if (Date.now() - s.lastProgrammatic < 60) return
      s.current = scrollEl.scrollTop
      s.target = scrollEl.scrollTop
    }

    scrollEl.addEventListener('wheel', handleWheel, { passive: false })
    scrollEl.addEventListener('scroll', handleScroll)

    return () => {
      scrollEl.removeEventListener('wheel', handleWheel)
      scrollEl.removeEventListener('scroll', handleScroll)
      if (s.rafId) cancelAnimationFrame(s.rafId)
      if (s.snapTimer) clearTimeout(s.snapTimer)
    }
  }, [])
}
