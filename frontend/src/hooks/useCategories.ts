import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export interface Category {
  id: number
  slug: string
  displayName: string
  sortOrder: number
  visible: boolean
  videoCount: number
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/categories')
      .then(res => setCategories(res.data))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}

export function useAdminCategories(token: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const headers = { Authorization: `Bearer ${token}` }

  const fetchCategories = useCallback(() => {
    setLoading(true)
    axios.get('/api/admin/categories', { headers })
      .then(res => setCategories(res.data))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  return { categories, loading, refetch: fetchCategories }
}
