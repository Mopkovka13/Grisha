import styles from './Contacts.module.css'

function Contacts({ scrollReveal }: { scrollReveal?: boolean }) {
  return (
    <section id="contacts" className={`${styles.contacts}${scrollReveal ? ' scroll-reveal' : ''}`}>

      <p className={styles.label}>Контакты</p>

      <div className={styles.main}>
        <h2 className={styles.heading}>
          ЕСТЬ<br />ПРОЕКТ?
        </h2>
        <a
          href="https://t.me/Dolphins_make_kikiki"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
        >
          НАПИСАТЬ В ТЕЛЕГРАМ&nbsp;↗
        </a>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>Телефон</span>
          <a href="tel:+79035121260" className={styles.footerValue}>
            +7 (903) 512-12-60
          </a>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>Email</span>
          <a href="mailto:grigoriikashkarov@icloud.com" className={styles.footerValue}>
            grigoriikashkarov@icloud.com
          </a>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>Соцсети</span>
          <div className={styles.socials}>
            <a href="https://t.me/Dolphins_make_kikiki" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>TG</a>
            <a href="https://www.instagram.com/hellolluvv" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>IG</a>
            <a href="https://vk.ru/helloluv" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>VK</a>
          </div>
        </div>
      </div>

    </section>
  )
}

export default Contacts
