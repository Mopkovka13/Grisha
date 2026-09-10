import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import styles from './Header.module.css'

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isOnCategoryPage = location.pathname.startsWith('/portfolio/')
  const { categories } = useCategories()

  useEffect(() => {
    const scroller = document.querySelector('.simplebar-content-wrapper')
    if (!scroller) return

    const handleScroll = () => {
      setScrolled(scroller.scrollTop > window.innerHeight * 0.8)
    }

    handleScroll()
    scroller.addEventListener('scroll', handleScroll)
    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  // Close the mobile sheet whenever the route changes
  useEffect(() => {
    setSheetOpen(false)
  }, [location.pathname])

  const handlePortfolioClick = (category: string) => {
    setSheetOpen(false)
    navigate(`/portfolio/${category}`)
  }

  const scrollToId = (id: string, attempts = 60) => {
    const el = document.getElementById(id)
    const scroller = document.querySelector('.simplebar-content-wrapper') as HTMLElement | null
    if (!el || !scroller) {
      if (attempts > 0) requestAnimationFrame(() => scrollToId(id, attempts - 1))
      return
    }
    const top = scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const goToSection = (id: string) => {
    setSheetOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      requestAnimationFrame(() => scrollToId(id))
    } else {
      scrollToId(id)
    }
  }

  return (
    <>
      <header className={`${styles.header} ${(scrolled || isOnCategoryPage) ? styles.scrolled : ''}`}>
        <a href="/" className={styles.logo} onClick={(e) => {
          if (isOnCategoryPage) {
            e.preventDefault()
            navigate('/')
          }
        }}>
          Grisha K.
        </a>
        <nav className={styles.nav}>
          <a href="#hero" className={styles.link}>Главная</a>
          <div className={styles.portfolioItem}>
            <a href="#portfolio" className={styles.link}>
              Портфолио <span className={styles.arrow}>▾</span>
            </a>
            <div className={styles.dropdown}>
              <div className={styles.dropdownInner}>
                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    className={styles.dropdownLink}
                    onClick={() => handlePortfolioClick(cat.slug)}
                  >
                    {cat.displayName}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <a href="#services" className={styles.link}>Услуги</a>
          <a href="#contacts" className={styles.link}>Контакты</a>
        </nav>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <div
        className={`${styles.sheetBackdrop} ${sheetOpen ? styles.sheetOpen : ''}`}
        onClick={() => setSheetOpen(false)}
      />
      <div className={`${styles.sheet} ${sheetOpen ? styles.sheetOpen : ''}`} role="dialog" aria-hidden={!sheetOpen}>
        <div className={styles.sheetHandle} />
        <p className={styles.sheetTitle}>Портфолио</p>
        <div className={styles.sheetList}>
          {categories.map(cat => (
            <button
              key={cat.slug}
              className={styles.sheetLink}
              onClick={() => handlePortfolioClick(cat.slug)}
            >
              {cat.displayName}
              <span className={styles.sheetArrow}>↗</span>
            </button>
          ))}
        </div>
      </div>

      <nav className={styles.bottomNav}>
        <button className={styles.bottomItem} onClick={() => goToSection('hero')}>
          <span className={styles.bottomIcon}>⌂</span>
          <span className={styles.bottomLabel}>Главная</span>
        </button>
        <button
          className={`${styles.bottomItem} ${sheetOpen ? styles.bottomItemActive : ''}`}
          onClick={() => setSheetOpen(v => !v)}
          aria-expanded={sheetOpen}
        >
          <span className={styles.bottomIcon}>▦</span>
          <span className={styles.bottomLabel}>Портфолио</span>
        </button>
        <button className={styles.bottomItem} onClick={() => goToSection('services')}>
          <span className={styles.bottomIcon}>≡</span>
          <span className={styles.bottomLabel}>Услуги</span>
        </button>
        <button className={styles.bottomItem} onClick={() => goToSection('contacts')}>
          <span className={styles.bottomIcon}>✦</span>
          <span className={styles.bottomLabel}>Контакты</span>
        </button>
      </nav>
    </>
  )
}

export default Header
