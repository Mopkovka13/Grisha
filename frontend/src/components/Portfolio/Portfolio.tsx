import { useState, useEffect, useRef, useCallback } from 'react'
import HLS from 'hls.js'
import styles from './Portfolio.module.css'
import { VideoResponse, videoApi } from '../../api/videoApi'
import { blockTextApi, BlockText } from '../../api/blockTextApi'
import { useCarousel } from '../../hooks/useCarousel'

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

/**
 * Placeholder ratio, used only until the real one is known. Neutral on purpose:
 * the backend can fail to read dimensions (ffprobe missing locally), and a 16:9
 * guess visibly cropped every photo that wasn't 16:9.
 */
const DEFAULT_RATIO = 1.5

function backendRatio(item: VideoResponse): number {
  if (!item.width || !item.height) return DEFAULT_RATIO
  return item.width / item.height
}

function Portfolio({ scrollReveal }: { scrollReveal?: boolean }) {
  const [videos, setVideos] = useState<VideoResponse[]>([])
  const [text, setText] = useState<BlockText | null>(null)
  // True ratios, measured from the images themselves once they decode
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    videoApi.getShowcaseVideos().then(setVideos).catch(() => {})
    blockTextApi.get('showcase').then(setText).catch(() => {})
  }, [])

  const { canPrev, canNext, goPrev, goNext } = useCarousel(stripRef, videos.length)

  /**
   * The browser knows the real proportions the moment the image decodes, so
   * take them from there rather than trusting the stored width/height — those
   * are null whenever ffprobe couldn't read the file.
   */
  const handleImageLoad = useCallback((id: number, img: HTMLImageElement) => {
    if (!img.naturalWidth || !img.naturalHeight) return
    const ratio = img.naturalWidth / img.naturalHeight
    setRatios(prev =>
      Math.abs((prev[id] ?? 0) - ratio) < 0.0001 ? prev : { ...prev, [id]: ratio }
    )
  }, [])

  return (
    <>
      <section id="portfolio" className={`${styles.about}${scrollReveal ? ' scroll-reveal' : ''}`}>
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
        <div className={styles.galleryHeader}>
          <div className={styles.galleryIntro}>
            {text?.heading && <h2 className={styles.galleryHeading}>{text.heading}</h2>}
            {text?.body && <p className={styles.galleryBody}>{text.body}</p>}
          </div>
        </div>

        <div className={styles.galleryViewport}>
          {/* Over the photos; hidden on touch, where you swipe instead */}
          <button
            type="button"
            className={`${styles.galleryArrow} ${styles.galleryArrowPrev}`}
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="Назад"
          >
            ←
          </button>
          <button
            type="button"
            className={`${styles.galleryArrow} ${styles.galleryArrowNext}`}
            onClick={goNext}
            disabled={!canNext}
            aria-label="Вперёд"
          >
            →
          </button>

          <div className={styles.galleryStrip} ref={stripRef}>
            {videos.map(item => (
              <div
                key={item.id}
                className={styles.galleryItem}
                style={{ '--item-ratio': ratios[item.id] ?? backendRatio(item) } as React.CSSProperties}
              >
                {item.mediaType === 'IMAGE' ? (
                  <img
                    src={item.imagePath ?? ''}
                    alt={item.title}
                    className={[
                      styles.galleryPhoto,
                      ratios[item.id] ? styles.galleryPhotoLoaded : '',
                    ].filter(Boolean).join(' ')}
                    loading="lazy"
                    decoding="async"
                    onLoad={e => handleImageLoad(item.id, e.currentTarget)}
                    // A cached image can already be complete before React
                    // attaches onLoad, and then it would never fire
                    ref={el => { if (el?.complete) handleImageLoad(item.id, el) }}
                  />
                ) : (
                  <LazyHlsVideo video={item} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Portfolio
