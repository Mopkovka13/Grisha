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
    return <div className={styles.container}>Загрузка видео...</div>
  }

  if (error) {
    return <div className={styles.container}>Ошибка: {error}</div>
  }

  if (videos.length === 0) {
    return <div className={styles.container}>Видео не найдены</div>
  }

  return (
    <div className={styles.grid}>
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
