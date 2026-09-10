import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useScrollLock } from '../../hooks/useScrollLock'
import { getScroller, offsetWithin, scrollEventTarget, viewportHeight } from '../../utils/scroll'
import styles from './Header.module.css'

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isOnCategoryPage = location.pathname.startsWith('/portfolio/')
  const onLightBackground = scrolled || isOnCategoryPage
  const { categories } = useCategories()

  useEffect(() => {
    const scroller = getScroller()
    const target = scrollEventTarget(scroller)

    const handleScroll = () => {
      setScrolled(scroller.scrollTop > viewportHeight(scroller) * 0.8)
    }

    handleScroll()
    target.addEventListener('scroll', handleScroll, { passive: true })
    return () => target.removeEventListener('scroll', handleScroll)
  }, [location.pathname, isMobile])

  // Close the mobile sheet whenever the route changes
  useEffect(() => {
    setSheetOpen(false)
  }, [location.pathname])

  useScrollLock(isMobile && sheetOpen)

  const handlePortfolioClick = (category: string) => {
    setSheetOpen(false)
    navigate(`/portfolio/${category}`)
  }

  const scrollToId = (id: string, attempts = 60) => {
    const el = document.getElementById(id)
    if (!el) {
      if (attempts > 0) requestAnimationFrame(() => scrollToId(id, attempts - 1))
      return
    }
    const scroller = getScroller()
    const top = offsetWithin(el, scroller)
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
      {/*
        Two independent states, deliberately not one class:
        `scrolled` = light background under the bar (also forced on category
        pages, where the bar must stay readable at the top of the page), while
        `hidden` = scrolled far enough that the mobile bar slides away. Folding
        them together would keep the bar permanently hidden on category pages.
      */}
      <header
        className={[
          styles.header,
          onLightBackground ? styles.scrolled : '',
          scrolled ? styles.hidden : '',
        ].filter(Boolean).join(' ')}
      >
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
