/**
 * The page scrolls in one of two ways depending on the viewport:
 *
 *   desktop — inside SimpleBar's `.simplebar-content-wrapper`, so we can style
 *             the scrollbar and run the custom curve easing;
 *   mobile  — the document itself, because only a scrolling top-level document
 *             makes Safari/Chrome collapse their URL bar and hand the page the
 *             full screen.
 *
 * These helpers let the rest of the app ignore the difference.
 */

/** The element that actually scrolls right now. */
export function getScroller(): HTMLElement {
  return (
    (document.querySelector('.simplebar-content-wrapper') as HTMLElement | null) ??
    (document.scrollingElement as HTMLElement | null) ??
    document.documentElement
  )
}

export function isDocumentScroller(el: Element): boolean {
  return el === document.documentElement || el === document.body
}

/**
 * Scroll events of the document fire on `document`/`window`, not on the
 * scrolling element itself — so the listener target isn't always the scroller.
 */
export function scrollEventTarget(scroller: HTMLElement): HTMLElement | Window {
  return isDocumentScroller(scroller) ? window : scroller
}

/** Offset of `el` from the top of the scrollable content. */
export function offsetWithin(el: HTMLElement, scroller: HTMLElement): number {
  if (isDocumentScroller(scroller)) {
    return el.getBoundingClientRect().top + window.scrollY
  }
  return scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
}

/** Visible height of one viewport of the scroller. */
export function viewportHeight(scroller: HTMLElement): number {
  return isDocumentScroller(scroller) ? window.innerHeight : scroller.clientHeight
}
