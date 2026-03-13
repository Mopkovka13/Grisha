import { useState, useEffect, useRef } from 'react'
import HLS from 'hls.js'
import styles from './Portfolio.module.css'
import { VideoResponse, videoApi } from '../../api/videoApi'

function LazyHlsVideo({ video }: { video: VideoResponse }) {
  const [active, setActive] = useState(false)
  const [hovering, setHovering] = useState(false)
  const hlsVideoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HLS | null>(null)

  useEffect(() => {
    if (!active || !hlsVideoRef.current || !video.hlsPath) return

    const el = hlsVideoRef.current

    if (HLS.isSupported()) {
      const hls = new HLS()
      hlsRef.current = hls
      hls.loadSource(video.hlsPath)
      hls.attachMedia(el)
      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        el.play()
      })
    } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = video.hlsPath
      el.addEventListener('loadedmetadata', () => el.play())
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [active, video.hlsPath])

  function handleMouseEnter() {
    setHovering(true)
    if (video.previewPath && previewRef.current) {
      previewRef.current.play()
    }
  }

  function handleMouseLeave() {
    setHovering(false)
    if (previewRef.current) {
      previewRef.current.pause()
      previewRef.current.currentTime = 0
    }
  }

  if (active) {
    return (
      <video
        ref={hlsVideoRef}
        poster={video.thumbnailPath ?? undefined}
        controls
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }

  const showPreview = hovering && !!video.previewPath

  return (
    <button
      className={styles.playBtn}
      onClick={() => setActive(true)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Воспроизвести"
      style={!showPreview && video.thumbnailPath ? { backgroundImage: `url(${video.thumbnailPath})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {video.previewPath && (
        <video
          ref={previewRef}
          src={video.previewPath}
          muted
          loop
          playsInline
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: showPreview ? 'block' : 'none' }}
        />
      )}
      <span className={styles.playIcon}>▶</span>
    </button>
  )
}

function Portfolio() {
  const [videos, setVideos] = useState<VideoResponse[]>([])

  useEffect(() => {
    videoApi.getShowcaseVideos().then(setVideos).catch(() => {})
  }, [])

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
          <img src="/about.webp" alt="Grisha K." className={styles.photo} decoding="async" />
        </div>
      </section>

      <section className={styles.works}>
        {videos.map((video, i) => {
          const tags = video.tags ? video.tags.split(',').map(t => t.trim()).filter(Boolean) : []
          return (
            <div
              key={video.id}
              className={`${styles.workRow} ${i % 2 !== 0 ? styles.workRowReverse : ''}`}
            >
              <div className={styles.workVideo}>
                <LazyHlsVideo video={video} />
              </div>
              <div className={styles.workInfo}>
                <p className={styles.workIndex}>0{i + 1}</p>
                <h3 className={styles.workTitle}>{video.title}</h3>
                {video.description && (
                  <p className={styles.workDescription}>{video.description}</p>
                )}
                {tags.length > 0 && (
                  <div className={styles.workTags}>
                    {tags.map(tag => (
                      <span key={tag} className={styles.workTag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}

export default Portfolio
