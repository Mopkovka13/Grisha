import styles from './Portfolio.module.css'

const videos = [
  {
    title: 'Свадебный фильм',
    embedId: '3ffdc06e551c8a369f1ddac88afdce94',
    description: 'Этот свадебный фильм — не репортаж, а короткометражная история о двух людях. Мы работали с естественным светом, искали детали, которые обычно остаются незамеченными. Результат — 12 минут, которые хочется пересматривать.',
    tags: ['Свадьба', '2024', 'Москва'],
  },
  {
    title: 'Рекламный ролик',
    embedId: 'c7113e61698fd14bbdbe1c5f34c0b718',
    description: 'Коммерческий проект для локального бренда одежды. Задача — показать продукт через образ, а не через каталог. Съёмка за один день, минимум реквизита, максимум атмосферы.',
    tags: ['Реклама', '2024', 'Санкт-Петербург'],
  },
  {
    title: 'Музыкальный клип',
    embedId: 'e499d3cdf5801b09d7a98c709df56f70',
    description: 'Клип снимался за двое суток в трёх локациях. Художественный образ строился вокруг контраста: холодная архитектура и живое, тёплое движение. Полностью ручная камера, никакого стабилизатора.',
    tags: ['Клип', '2023', 'Казань'],
  },
  {
    title: 'Корпоративное видео',
    embedId: '3df696d49bbd60a3daee3c066f0136e6',
    description: 'Документальный фильм о команде производственной компании. Не корпоративный глянец, а честный взгляд на людей и процессы. Интервью, рабочие моменты, живые эмоции.',
    tags: ['Корпоратив', '2023', 'Нижний Новгород'],
  },
]

function Portfolio() {
  return (
    <>
      <section id="portfolio" className={styles.about}>
        <div className={styles.left}>
          <p className={styles.subtitle}>КИНЕМАТОГРАФИЧНЫЙ&nbsp;&nbsp;И<br />ЕСТЕСТВЕННЫЙ</p>

          <div className={styles.headingRow}>
            <h2 className={styles.heading}>
              ВИДЕО<br />КОТОРОЕ<br />ГОВОРИТ
            </h2>
            <p className={styles.slogan}>НИКАКОГО<br />ШАБЛОНА.</p>
          </div>

          <p className={styles.description}>
            Меня зовут Гриша. Я снимаю видео, которые живут дольше момента —
            свадьбы, рекламные ролики, клипы, мероприятия. Не шаблонные
            нарезки под поп-музыку, а истории с характером, светом и ритмом.
            Каждый кадр — это решение, каждая склейка — это смысл.
          </p>

          <a
            href="https://t.me/Dolphins_make_kikiki"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >
            НАПИСАТЬ В ТЕЛЕГРАМ&nbsp;↗
          </a>
        </div>

        <div className={styles.right}>
          <img src="/about.jpeg" alt="Grisha K." className={styles.photo} />
        </div>
      </section>

      <section className={styles.works}>
        {videos.map((video, i) => (
          <div
            key={video.embedId}
            className={`${styles.workRow} ${i % 2 !== 0 ? styles.workRowReverse : ''}`}
          >
            <div className={styles.workVideo}>
              <iframe
                src={`https://rutube.ru/play/embed/${video.embedId}`}
                title={video.title}
                allow="clipboard-write; autoplay"
                allowFullScreen
              />
            </div>
            <div className={styles.workInfo}>
              <p className={styles.workIndex}>0{i + 1}</p>
              <h3 className={styles.workTitle}>{video.title}</h3>
              <p className={styles.workDescription}>{video.description}</p>
              <div className={styles.workTags}>
                {video.tags.map(tag => (
                  <span key={tag} className={styles.workTag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

export default Portfolio
