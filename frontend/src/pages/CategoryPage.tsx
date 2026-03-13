import { useParams } from 'react-router-dom'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import Header from '../components/Header/Header'
import VideoGrid from '../components/portfolio/VideoGrid'
import { useVideos } from '../hooks/useVideos'
import { useCategories } from '../hooks/useCategories'
import { useCurveScroll } from '../hooks/useCurveScroll'
import styles from './CategoryPage.module.css'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { categories, loading: categoriesLoading } = useCategories()
  const currentCategory = categories.find(c => c.slug === category)
  const { videos, loading, error } = useVideos(currentCategory ? category : undefined)

  useCurveScroll()

  if (!categoriesLoading && (!category || !currentCategory)) {
    return (
      <SimpleBar style={{ height: '100vh' }}>
        <div className={styles.page}>
          <Header />
          <div className={styles.container}>
            <div className={styles.header}>
              <h1 className={styles.title}>404</h1>
            </div>
          </div>
        </div>
      </SimpleBar>
    )
  }

  return (
    <SimpleBar style={{ height: '100vh' }}>
      <div className={styles.page}>
        <Header />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{currentCategory?.displayName ?? ''}</h1>
            {!loading && !categoriesLoading && (
              <div className={styles.meta}>
                <span className={styles.count}>{String(videos.length).padStart(2, '0')} видео</span>
                <span className={styles.year}>© 2025</span>
              </div>
            )}
          </div>
          <VideoGrid videos={videos} loading={loading || categoriesLoading} error={error} />
        </div>
      </div>
    </SimpleBar>
  )
}
