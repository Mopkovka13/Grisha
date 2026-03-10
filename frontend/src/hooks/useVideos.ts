import { useState, useEffect } from 'react'
import videoApi, { VideoResponse } from '../api/videoApi'

export function useVideos(category?: string) {
  const [videos, setVideos] = useState<VideoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = category
          ? await videoApi.getVideosByCategory(category)
          : await videoApi.getAllVideos()
        setVideos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
        setVideos([])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [category])

  return { videos, loading, error }
}
