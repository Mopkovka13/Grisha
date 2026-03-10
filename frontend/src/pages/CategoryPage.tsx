import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header/Header'
import VideoGrid from '../components/portfolio/VideoGrid'
import { useVideos } from '../hooks/useVideos'
import styles from './CategoryPage.module.css'

const categoryNames: { [key: string]: string } = {
  wedding: 'Свадебное видео',
  corporate: 'Корпоративное видео',
  other: 'Другое видео',
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { videos, loading, error } = useVideos(category?.toUpperCase())

  if (!category || !categoryNames[category.toLowerCase()]) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.container}>
          <h1>Категория не найдена</h1>
          <button className={styles.homeButton} onClick={() => navigate('/')}>
            ← На главную
          </button>
        </div>
      </div>
    )
  }

  const displayName = categoryNames[category.toLowerCase()]

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            ← На главную
          </button>
          <h1>{displayName}</h1>
        </div>
        <VideoGrid videos={videos} loading={loading} error={error} />
      </div>
    </div>
  )
}
