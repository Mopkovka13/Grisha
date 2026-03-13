import { useEffect } from 'react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import Portfolio from '../components/Portfolio/Portfolio'
import Services from '../components/Services/Services'
import Contacts from '../components/Contacts/Contacts'
import { useCurveScroll } from '../hooks/useCurveScroll'
import styles from '../App.module.css'

function Landing() {
  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const scrollEl = document.querySelector('.simplebar-content-wrapper')
    if (!scrollEl) return

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

    scrollEl.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Smooth curve scroll + snap for Hero & Contacts
  useCurveScroll()

  return (
    <SimpleBar style={{ height: '100vh' }}>
      <div className={styles.app}>
        <Header />
        <Hero />
        <Portfolio scrollReveal />
        <Services />
        <Contacts scrollReveal />
      </div>
    </SimpleBar>
  )
}

export default Landing
