import styles from './Contacts.module.css'

function Contacts() {
  return (
    <section id="contacts" className={styles.contacts}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Контакты</h2>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <h3 className={styles.infoLabel}>Телефон</h3>
            <a href="tel:+79035121260" className={styles.infoValue}>
              +7 (903) 512-12-60
            </a>
          </div>
          <div className={styles.infoItem}>
            <h3 className={styles.infoLabel}>Email</h3>
            <a href="mailto:grigoriikashkarov@icloud.com" className={styles.infoValue}>
              grigoriikashkarov@icloud.com
            </a>
          </div>
          <div className={styles.infoItem}>
            <h3 className={styles.infoLabel}>Соцсети</h3>
            <div className={styles.socials}>
              <a href="https://t.me/Dolphins_make_kikiki" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Telegram</a>
              <a href="https://www.instagram.com/hellolluvv" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
              <a href="https://vk.ru/helloluv" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>VK</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contacts
