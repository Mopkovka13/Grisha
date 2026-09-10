import { useEffect, useState } from 'react'

export const MOBILE_QUERY = '(max-width: 768px)'

/** Tracks the mobile breakpoint — the same one the CSS uses. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handleChange = () => setIsMobile(mql.matches)

    handleChange()
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
