import styles from './Services.module.css'

const services = [
  {
    title: 'Свадебная съёмка',
    description:
      'Полный день съёмки, монтаж свадебного фильма и короткого ролика для соцсетей. Сохраню самые трогательные моменты вашего дня.',
    price: 'от 50 000 ₽',
  },
  {
    title: 'Рекламные ролики',
    description:
      'Создание рекламных видео для бизнеса: от разработки концепции до финального монтажа и цветокоррекции.',
    price: 'от 80 000 ₽',
  },
  {
    title: 'Музыкальные клипы',
    description:
      'Съёмка и постпродакшн музыкальных клипов любой сложности. Работаю с артистами всех жанров.',
    price: 'от 100 000 ₽',
  },
  {
    title: 'Мероприятия',
    description:
      'Видеосъёмка конференций, корпоративов, концертов и других мероприятий. Многокамерная съёмка.',
    price: 'от 30 000 ₽',
  },
]

function Services() {
  return (
    <section id="services" className={styles.services}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {services.map((service) => (
            <div key={service.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDescription}>{service.description}</p>
              <p className={styles.cardPrice}>{service.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
