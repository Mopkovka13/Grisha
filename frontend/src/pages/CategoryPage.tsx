import { useParams } from 'react-router-dom'
import Header from '../components/Header/Header'
import VideoGrid from '../components/portfolio/VideoGrid'
import { useVideos } from '../hooks/useVideos'
import { useCategories } from '../hooks/useCategories'
import styles from './CategoryPage.module.css'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { categories, loading: categoriesLoading } = useCategories()
  const currentCategory = categories.find(c => c.slug === category)
  const { videos, loading, error } = useVideos(currentCategory ? category : undefined)

  if (!categoriesLoading && (!category || !currentCategory)) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.container}>
          <h1>Категория не найдена</h1>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{currentCategory?.displayName ?? ''}</h1>
        </div>
        <VideoGrid videos={videos} loading={loading || categoriesLoading} error={error} />
      </div>
    </div>
  )
}
