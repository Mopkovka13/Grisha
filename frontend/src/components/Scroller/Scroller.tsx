import { ReactNode } from 'react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * Desktop: a SimpleBar container with a custom scrollbar.
 * Mobile: nothing at all — the document scrolls natively, which is what lets
 * the browser shrink its URL bar and gives the page the whole screen.
 */
export default function Scroller({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()

  if (isMobile) return <>{children}</>

  return <SimpleBar style={{ height: '100vh' }}>{children}</SimpleBar>
}
