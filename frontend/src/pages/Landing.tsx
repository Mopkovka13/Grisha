import { useEffect } from 'react'
import Scroller from '../components/Scroller/Scroller'
import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import Portfolio from '../components/Portfolio/Portfolio'
import Services from '../components/Services/Services'
import Contacts from '../components/Contacts/Contacts'
import { useCurveScroll } from '../hooks/useCurveScroll'
import { useIsTouchViewport } from '../hooks/useIsTouchViewport'
import { useCanvasBackground } from '../hooks/useCanvasBackground'
import { useThemeColor } from '../hooks/useThemeColor'
import styles from '../App.module.css'

function Landing() {
  const isTouch = useIsTouchViewport()

  // Dark hero at the top, dark contacts at the bottom — so the notch area and
  // the overscroll at either end stay dark instead of flashing white
  useCanvasBackground('#0a0a0a')
  useThemeColor(['hero', 'contacts'])

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    // On touch the document scrolls, which is the observer's default root
    const scrollEl = isTouch ? null : document.querySelector('.simplebar-content-wrapper')
    if (!isTouch && !scrollEl) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { root: scrollEl, threshold: 0.08 }
    )

    const scope = scrollEl ?? document
    scope.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [isTouch])

  // Smooth curve scroll + snap for Hero & Contacts (desktop only)
  useCurveScroll()

  return (
    <Scroller>
      <div className={styles.app}>
        <Header />
        <Hero />
        <Portfolio scrollReveal />
        <Services />
        <Contacts scrollReveal />
      </div>
    </Scroller>
  )
}

export default Landing
