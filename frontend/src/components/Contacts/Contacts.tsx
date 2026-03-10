import { FormEvent, useState } from 'react'
import styles from './Contacts.module.css'

function Contacts() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contacts" className={styles.contacts}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Контакты</h2>
        <div className={styles.content}>
          <div className={styles.info}>
            <div className={styles.infoItem}>
              <h3 className={styles.infoLabel}>Телефон</h3>
              <a href="tel:+79991234567" className={styles.infoValue}>
                +7 (999) 123-45-67
              </a>
            </div>
            <div className={styles.infoItem}>
              <h3 className={styles.infoLabel}>Email</h3>
              <a href="mailto:grisha@example.com" className={styles.infoValue}>
                grisha@example.com
              </a>
            </div>
            <div className={styles.infoItem}>
              <h3 className={styles.infoLabel}>Соцсети</h3>
              <div className={styles.socials}>
                <a href="#" className={styles.socialLink}>Telegram</a>
                <a href="#" className={styles.socialLink}>Instagram</a>
                <a href="#" className={styles.socialLink}>YouTube</a>
              </div>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {submitted ? (
              <p className={styles.success}>
                Спасибо! Ваше сообщение отправлено.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className={styles.input}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className={styles.input}
                  required
                />
                <textarea
                  placeholder="Сообщение"
                  className={styles.textarea}
                  rows={5}
                  required
                />
                <button type="submit" className={styles.button}>
                  Отправить
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}

export default Contacts
