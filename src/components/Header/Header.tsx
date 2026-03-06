import { useEffect, useState } from 'react'
import styles from './Header.module.css'

function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const scroller = document.querySelector('.simplebar-content-wrapper')
    if (!scroller) return

    const handleScroll = () => {
      setScrolled(scroller.scrollTop > window.innerHeight * 0.8)
    }

    scroller.addEventListener('scroll', handleScroll)
    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <a href="#hero" className={styles.logo}>
        Grisha K.
      </a>
      <nav className={styles.nav}>
        <a href="#hero" className={styles.link}>Главная</a>
        <a href="#portfolio" className={styles.link}>Портфолио</a>
        <a href="#services" className={styles.link}>Услуги</a>
        <a href="#contacts" className={styles.link}>Контакты</a>
      </nav>
    </header>
  )
}

export default Header
