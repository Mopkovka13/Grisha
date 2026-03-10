import styles from './Hero.module.css'

function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        src="/general.mp4"
      />
    </section>
  )
}

export default Hero
