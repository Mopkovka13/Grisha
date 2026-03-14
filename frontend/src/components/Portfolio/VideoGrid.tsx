import { VideoResponse } from '../../api/videoApi'
import VideoCard from './VideoCard'
import styles from './VideoGrid.module.css'

interface VideoGridProps {
  videos: VideoResponse[]
  loading?: boolean
  error?: string | null
}

export default function VideoGrid({ videos, loading, error }: VideoGridProps) {
  if (loading) {
    return <div className={styles.empty}>Загрузка...</div>
  }

  if (error) {
    return <div className={styles.empty}>Ошибка: {error}</div>
  }

  if (videos.length === 0) {
    return <div className={styles.empty}>Видео не найдены</div>
  }

  return (
    <div className={styles.list}>
      {videos.map((video, index) => (
        <VideoCard key={video.id} video={video} index={index} />
      ))}
    </div>
  )
}
