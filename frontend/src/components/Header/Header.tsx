import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import styles from './Header.module.css'

function Header() {
  const [scrolled, setScrolled] = useState(false)
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

    scroller.addEventListener('scroll', handleScroll)
    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePortfolioClick = (category: string) => {
    navigate(`/portfolio/${category}`)
  }

  return (
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
  )
}

export default Header
