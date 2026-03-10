import { useEffect, useRef } from 'react'
import HLS from 'hls.js'
import { VideoResponse } from '../../api/videoApi'
import styles from './VideoPlayerModal.module.css'

interface VideoPlayerModalProps {
  video: VideoResponse
  onClose: () => void
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HLS | null>(null)

  useEffect(() => {
    if (!videoRef.current || !video.hlsPath) return

    const video_element = videoRef.current

    if (HLS.isSupported()) {
      const hls = new HLS()
      hlsRef.current = hls

      hls.loadSource(video.hlsPath)
      hls.attachMedia(video_element)
      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        video_element.play()
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
      }
    }
  }, [video.hlsPath])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className={styles.modal} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
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
