import { ReactNode } from 'react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { useIsTouchViewport } from '../../hooks/useIsTouchViewport'

/**
 * Touch: nothing at all — the document scrolls natively, which is what lets
 * the browser shrink its URL bar and gives the page the whole screen.
 * Otherwise: a SimpleBar container with a custom scrollbar.
 *
 * Switching between the two remounts everything below, so the choice is keyed
 * on the device rather than on the viewport width — see `useIsTouchViewport`.
 */
export default function Scroller({ children }: { children: ReactNode }) {
  const isTouch = useIsTouchViewport()

  if (isTouch) return <>{children}</>

  return <SimpleBar style={{ height: '100vh' }}>{children}</SimpleBar>
}
