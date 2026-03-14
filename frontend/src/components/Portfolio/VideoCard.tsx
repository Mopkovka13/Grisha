import { useState, useRef } from 'react'
import { VideoResponse } from '../../api/videoApi'
import VideoPlayerModal from './VideoPlayerModal'
import styles from './VideoCard.module.css'

interface VideoCardProps {
  video: VideoResponse
  index: number
}

export default function VideoCard({ video, index }: VideoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = () => {
    if (video.previewPath && videoRef.current) {
      videoRef.current.play()
      setPreviewActive(true)
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setPreviewActive(false)
  }

  return (
    <>
      <div
        className={styles.card}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsModalOpen(true)}
      >
        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>

        <div className={styles.info}>
          <h3 className={styles.title}>{video.title}</h3>
        </div>

        <div className={styles.thumbWrap}>
          <img
            src={video.thumbnailPath || '/placeholder.jpg'}
            alt={video.title}
            className={styles.thumbnail}
            style={{ opacity: previewActive ? 0 : 1 }}
          />
          {video.previewPath && (
            <video
              ref={videoRef}
              src={video.previewPath}
              className={styles.preview}
              muted
              loop
              playsInline
              style={{ opacity: previewActive ? 1 : 0 }}
            />
          )}
        </div>

        <span className={styles.arrow}>↗</span>
      </div>

      {isModalOpen && (
        <VideoPlayerModal
          video={video}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
