import { useEffect, useRef, useState } from 'react'
import HLS from 'hls.js'
import { VideoResponse } from '../../api/videoApi'
import styles from './VideoPlayerModal.module.css'

interface QualityLevel {
  index: number
  label: string
}

interface VideoPlayerModalProps {
  video: VideoResponse
  onClose: () => void
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HLS | null>(null)
  const [levels, setLevels] = useState<QualityLevel[]>([])
  const [currentLevel, setCurrentLevel] = useState<number>(-1)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!videoRef.current || !video.hlsPath) return

    const video_element = videoRef.current

    if (HLS.isSupported()) {
      const hls = new HLS()
      hlsRef.current = hls

      hls.loadSource(video.hlsPath)
      hls.attachMedia(video_element)
      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        const ql: QualityLevel[] = hls.levels.map((l, i) => ({
          index: i,
          label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k`,
        }))
        setLevels(ql)
        setCurrentLevel(-1)
        video_element.play()
      })
      hls.on(HLS.Events.LEVEL_SWITCHED, (_, data) => {
        if (hls.autoLevelEnabled) setCurrentLevel(-1)
        else setCurrentLevel(data.level)
      })
    } else if (video_element.canPlayType('application/vnd.apple.mpegurl')) {
      video_element.src = video.hlsPath
      video_element.addEventListener('loadedmetadata', () => {
        video_element.play()
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      setLevels([])
      setCurrentLevel(-1)
      setMenuOpen(false)
    }
  }, [video.hlsPath])

  function selectLevel(index: number) {
    if (!hlsRef.current) return
    hlsRef.current.currentLevel = index
    setCurrentLevel(index)
    setMenuOpen(false)
  }

  function selectAuto() {
    if (!hlsRef.current) return
    hlsRef.current.currentLevel = -1
    setCurrentLevel(-1)
    setMenuOpen(false)
  }

  const currentLabel = currentLevel === -1
    ? 'Авто'
    : (levels.find(l => l.index === currentLevel)?.label ?? 'Авто')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (menuOpen) setMenuOpen(false)
      else onClose()
    }
  }

  return (
    <div className={styles.modal} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        {levels.length > 1 && (
          <div className={styles.qualityWrapper}>
            <button
              className={styles.qualityBtn}
              onClick={() => setMenuOpen(v => !v)}
            >
              {currentLabel}
            </button>
            {menuOpen && (
              <div className={styles.qualityMenu}>
                <button
                  className={`${styles.qualityOption} ${currentLevel === -1 ? styles.qualityActive : ''}`}
                  onClick={selectAuto}
                >
                  Авто
                </button>
                {[...levels].reverse().map(l => (
                  <button
                    key={l.index}
                    className={`${styles.qualityOption} ${currentLevel === l.index ? styles.qualityActive : ''}`}
                    onClick={() => selectLevel(l.index)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <video
          ref={videoRef}
          className={styles.video}
          controls
          playsInline
        />
        <div className={styles.info}>
          <h2>{video.title}</h2>
        </div>
      </div>
    </div>
  )
}
