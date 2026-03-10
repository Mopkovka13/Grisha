import { useState, useRef } from 'react'
import { VideoResponse } from '../../api/videoApi'
import VideoPlayerModal from './VideoPlayerModal'
import styles from './VideoCard.module.css'

interface VideoCardProps {
  video: VideoResponse
}

export default function VideoCard({ video }: VideoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = () => {
    if (video.previewPath && videoRef.current) {
      videoRef.current.play()
      setIsPlayingPreview(true)
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlayingPreview(false)
    }
  }

  return (
    <>
      <div
        className={styles.card}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={video.thumbnailPath || '/placeholder.jpg'}
          alt={video.title}
          className={styles.thumbnail}
          style={{ display: isPlayingPreview ? 'none' : 'block' }}
        />
        {video.previewPath && (
          <video
            ref={videoRef}
            src={video.previewPath}
            className={styles.preview}
            muted
            loop
            playsInline
            style={{ display: isPlayingPreview ? 'block' : 'none' }}
          />
        )}
        <div className={styles.overlay}>
          <div className={styles.playButton}>▶</div>
        </div>
        <h3 className={styles.title}>{video.title}</h3>
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
