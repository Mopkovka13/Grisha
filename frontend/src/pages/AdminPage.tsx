import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import styles from './AdminPage.module.css'

type Category = 'WEDDING' | 'CORPORATE' | 'OTHER'
type Status = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'

interface Video {
  id: number
  title: string
  thumbnailPath: string | null
  status: Status
  progress: number
  category: Category
  sortOrder: number
}

const CATEGORIES: Category[] = ['WEDDING', 'CORPORATE', 'OTHER']
const ALL_RESOLUTIONS = [144, 240, 360, 480, 720, 1080]
const TOKEN_KEY = 'admin_token'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  )

  function handleLogin(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  if (!token) return <LoginForm onLogin={handleLogin} />
  return <AdminPanel token={token} onLogout={handleLogout} />
}

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/admin/login', { password })
      onLogin(res.data.token)
    } catch {
      setError('Неверный пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2>Вход</h2>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Пароль"
          autoFocus
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}

function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [activeCategory, setActiveCategory] = useState<Category>('WEDDING')
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState<Category>('WEDDING')
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedResolutions, setSelectedResolutions] = useState<number[]>(ALL_RESOLUTIONS)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  const headers = authHeaders(token)

  async function fetchVideos() {
    try {
      const res = await axios.get('/api/admin/videos', { headers })
      setVideos(res.data)
    } catch (e: any) {
      if (e.response?.status === 401) onLogout()
    }
  }

  useEffect(() => {
    fetchVideos()
    // Poll for transcoding progress
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [])

  function toggleResolution(res: number) {
    setSelectedResolutions(prev =>
      prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]
    )
  }

  function toggleAll() {
    setSelectedResolutions(prev =>
      prev.length === ALL_RESOLUTIONS.length ? [] : [...ALL_RESOLUTIONS]
    )
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !uploadTitle.trim()) return
    if (selectedResolutions.length === 0) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', uploadTitle)
    formData.append('category', uploadCategory)
    formData.append('resolutions', selectedResolutions.sort((a, b) => a - b).join(','))

    setUploading(true)
    setUploadStatus('Загружаем... 0%')
    try {
      await axios.post('/api/admin/videos/upload', formData, {
        headers,
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0
          setUploadStatus(`Загружаем... ${pct}%`)
        }
      })
      setUploadStatus('Загружено — идёт транскодирование')
      setUploadTitle('')
      if (fileRef.current) fileRef.current.value = ''
      fetchVideos()
    } catch {
      setUploadStatus('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить видео?')) return
    await axios.delete(`/api/admin/videos/${id}`, { headers })
    setVideos(v => v.filter(v => v.id !== id))
  }

  function handleDragStart(id: number) {
    setDraggedId(id)
  }

  function handleDragOver(e: React.DragEvent, id: number) {
    e.preventDefault()
    setDragOverId(id)
  }

  async function handleDrop(targetId: number) {
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const categoryVideos = videos
      .filter(v => v.category === activeCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const from = categoryVideos.findIndex(v => v.id === draggedId)
    const to = categoryVideos.findIndex(v => v.id === targetId)
    const reordered = [...categoryVideos]
    const [item] = reordered.splice(from, 1)
    reordered.splice(to, 0, item)

    // Update local state optimistically
    const others = videos.filter(v => v.category !== activeCategory)
    setVideos([...others, ...reordered])
    setDraggedId(null)
    setDragOverId(null)

    await axios.put(
      '/api/admin/videos/reorder',
      { orderedIds: reordered.map(v => v.id) },
      { headers }
    )
  }

  const categoryVideos = videos
    .filter(v => v.category === activeCategory)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeader}>
        <h1>Управление видео</h1>
        <button onClick={onLogout} className={styles.logoutBtn}>Выйти</button>
      </div>

      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <input ref={fileRef} type="file" accept="video/*" required />
        <input
          type="text"
          value={uploadTitle}
          onChange={e => setUploadTitle(e.target.value)}
          placeholder="Название"
          required
        />
        <select
          value={uploadCategory}
          onChange={e => setUploadCategory(e.target.value as Category)}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className={styles.resolutionsRow}>
          <label className={styles.resolutionLabel}>
            <input
              type="checkbox"
              checked={selectedResolutions.length === ALL_RESOLUTIONS.length}
              onChange={toggleAll}
            />
            Все
          </label>
          {ALL_RESOLUTIONS.map(res => (
            <label key={res} className={styles.resolutionLabel}>
              <input
                type="checkbox"
                checked={selectedResolutions.includes(res)}
                onChange={() => toggleResolution(res)}
              />
              {res}p
            </label>
          ))}
        </div>
        <button type="submit" disabled={uploading || selectedResolutions.length === 0} className={styles.uploadBtn}>
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
        {uploadStatus && <span className={styles.uploadStatus}>{uploadStatus}</span>}
      </form>

      <div className={styles.tabs}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`${styles.tab} ${activeCategory === c ? styles.tabActive : ''}`}
            onClick={() => setActiveCategory(c)}
          >
            {c} ({videos.filter(v => v.category === c).length})
          </button>
        ))}
      </div>

      <div className={styles.videoGrid}>
        {categoryVideos.map(video => (
          <div
            key={video.id}
            className={`${styles.videoCard} ${dragOverId === video.id ? styles.dragOver : ''}`}
            draggable
            onDragStart={() => handleDragStart(video.id)}
            onDragOver={e => handleDragOver(e, video.id)}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(video.id)}
            onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
          >
            <div className={styles.thumbnail}>
              {video.thumbnailPath
                ? <img src={video.thumbnailPath} alt={video.title} />
                : <div className={styles.noThumb}>
                    {video.status === 'PROCESSING' ? `${video.progress}%` : '—'}
                  </div>
              }
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardTitle}>{video.title}</span>
              <span className={`${styles.status} ${styles['status' + video.status]}`}>
                {video.status === 'PROCESSING' ? `${video.progress}%` : video.status}
              </span>
            </div>
            <button className={styles.deleteBtn} onClick={() => handleDelete(video.id)}>
              ✕
            </button>
          </div>
        ))}
        {categoryVideos.length === 0 && (
          <p className={styles.empty}>Нет видео в этой категории</p>
        )}
      </div>
    </div>
  )
}
