import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAdminCategories, Category } from '../hooks/useCategories'
import styles from './AdminPage.module.css'

type Status = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'

interface Video {
  id: number
  title: string
  thumbnailPath: string | null
  status: Status
  progress: number
  category: string
  sortOrder: number
}

const ALL_RESOLUTIONS = [144, 240, 360, 480, 720, 1080]
const TOKEN_KEY = 'admin_token'
const SLUG_RE = /^[a-z0-9-]+$/

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
  const headers = authHeaders(token)
  const { categories, refetch: refetchCats } = useAdminCategories(token)

  // ── Videos ────────────────────────────────────────────────────────────────
  const [videos, setVideos] = useState<Video[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug)
    }
  }, [categories])

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
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [])

  // ── Upload ────────────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')
  const [selectedResolutions, setSelectedResolutions] = useState<number[]>(ALL_RESOLUTIONS)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (categories.length > 0 && !uploadCategory) {
      setUploadCategory(categories[0].slug)
    }
  }, [categories])

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
    if (!file || !uploadTitle.trim() || !uploadCategory || selectedResolutions.length === 0) return

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

  // ── Video drag-reorder ────────────────────────────────────────────────────
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  async function handleDrop(targetId: number) {
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null); setDragOverId(null); return
    }
    const catVideos = videos
      .filter(v => v.category === activeCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const from = catVideos.findIndex(v => v.id === draggedId)
    const to = catVideos.findIndex(v => v.id === targetId)
    const reordered = [...catVideos]
    const [item] = reordered.splice(from, 1)
    reordered.splice(to, 0, item)
    setVideos([...videos.filter(v => v.category !== activeCategory), ...reordered])
    setDraggedId(null); setDragOverId(null)
    await axios.put('/api/admin/videos/reorder', { orderedIds: reordered.map(v => v.id) }, { headers })
  }

  async function handleDeleteVideo(id: number) {
    if (!confirm('Удалить видео?')) return
    await axios.delete(`/api/admin/videos/${id}`, { headers })
    setVideos(v => v.filter(v => v.id !== id))
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

      <CategoriesSection token={token} categories={categories} onRefetch={refetchCats} />

      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <input ref={fileRef} type="file" accept="video/*" required />
        <input
          type="text"
          value={uploadTitle}
          onChange={e => setUploadTitle(e.target.value)}
          placeholder="Название"
          required
        />
        <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
          {categories.map(c => (
            <option key={c.slug} value={c.slug}>{c.displayName}</option>
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
        <button type="submit" disabled={uploading || selectedResolutions.length === 0 || !uploadCategory} className={styles.uploadBtn}>
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
        {uploadStatus && <span className={styles.uploadStatus}>{uploadStatus}</span>}
      </form>

      <div className={styles.tabs}>
        {categories.map(c => (
          <button
            key={c.slug}
            className={`${styles.tab} ${activeCategory === c.slug ? styles.tabActive : ''}`}
            onClick={() => setActiveCategory(c.slug)}
          >
            {c.displayName} ({videos.filter(v => v.category === c.slug).length})
          </button>
        ))}
      </div>

      <div className={styles.videoGrid}>
        {categoryVideos.map(video => (
          <div
            key={video.id}
            className={`${styles.videoCard} ${dragOverId === video.id ? styles.dragOver : ''}`}
            draggable
            onDragStart={() => setDraggedId(video.id)}
            onDragOver={e => { e.preventDefault(); setDragOverId(video.id) }}
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
            <button className={styles.deleteBtn} onClick={() => handleDeleteVideo(video.id)}>✕</button>
          </div>
        ))}
        {categoryVideos.length === 0 && (
          <p className={styles.empty}>Нет видео в этой категории</p>
        )}
      </div>
    </div>
  )
}

// ── Categories management section ─────────────────────────────────────────

function CategoriesSection({
  token,
  categories,
  onRefetch,
}: {
  token: string
  categories: Category[]
  onRefetch: () => void
}) {
  const headers = authHeaders(token)
  const [showAdd, setShowAdd] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [catDraggedId, setCatDraggedId] = useState<number | null>(null)
  const [catDragOverId, setCatDragOverId] = useState<number | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    const slug = newSlug.trim().toLowerCase()
    if (!SLUG_RE.test(slug)) {
      setAddError('Только a-z, 0-9, дефис')
      return
    }
    try {
      await axios.post('/api/admin/categories', null, {
        params: { slug, displayName: newName.trim() },
        headers,
      })
      setNewSlug(''); setNewName(''); setShowAdd(false)
      onRefetch()
    } catch (e: any) {
      setAddError(e.response?.data || 'Ошибка')
    }
  }

  async function saveName(cat: Category) {
    if (editingName.trim() && editingName.trim() !== cat.displayName) {
      await axios.put(`/api/admin/categories/${cat.id}`, null, {
        params: { displayName: editingName.trim() },
        headers,
      })
      onRefetch()
    }
    setEditingId(null)
  }

  async function toggleVisible(cat: Category) {
    await axios.put(`/api/admin/categories/${cat.id}`, null, {
      params: { visible: !cat.visible },
      headers,
    })
    onRefetch()
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Удалить категорию «${cat.displayName}»?`)) return
    try {
      await axios.delete(`/api/admin/categories/${cat.id}`, { headers })
      onRefetch()
    } catch (e: any) {
      alert(e.response?.data || 'Ошибка удаления')
    }
  }

  async function handleCatDrop(targetId: number) {
    if (catDraggedId === null || catDraggedId === targetId) {
      setCatDraggedId(null); setCatDragOverId(null); return
    }
    const from = categories.findIndex(c => c.id === catDraggedId)
    const to = categories.findIndex(c => c.id === targetId)
    const reordered = [...categories]
    const [item] = reordered.splice(from, 1)
    reordered.splice(to, 0, item)
    setCatDraggedId(null); setCatDragOverId(null)
    await axios.put('/api/admin/categories/reorder',
      { orderedIds: reordered.map(c => c.id) }, { headers })
    onRefetch()
  }

  return (
    <div className={styles.categoriesSection}>
      <div className={styles.catSectionHeader}>
        <span>Категории</span>
        <button className={styles.catAddBtn} onClick={() => { setShowAdd(v => !v); setAddError('') }}>
          {showAdd ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showAdd && (
        <form className={styles.catAddForm} onSubmit={handleAdd}>
          <input
            placeholder="slug (латиница)"
            value={newSlug}
            onChange={e => setNewSlug(e.target.value)}
            required
          />
          <input
            placeholder="Название"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <button type="submit">Создать</button>
          {addError && <span className={styles.catError}>{addError}</span>}
        </form>
      )}

      <div className={styles.catList}>
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`${styles.catRow} ${!cat.visible ? styles.catHidden : ''} ${catDragOverId === cat.id ? styles.catDragOver : ''}`}
            draggable
            onDragStart={() => setCatDraggedId(cat.id)}
            onDragOver={e => { e.preventDefault(); setCatDragOverId(cat.id) }}
            onDragLeave={() => setCatDragOverId(null)}
            onDrop={() => handleCatDrop(cat.id)}
            onDragEnd={() => { setCatDraggedId(null); setCatDragOverId(null) }}
          >
            <span className={styles.catHandle}>⠿</span>

            {editingId === cat.id ? (
              <input
                className={styles.catNameInput}
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onBlur={() => saveName(cat)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveName(cat)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                autoFocus
              />
            ) : (
              <span
                className={styles.catName}
                onClick={() => { setEditingId(cat.id); setEditingName(cat.displayName) }}
                title="Нажмите, чтобы переименовать"
              >
                {cat.displayName}
              </span>
            )}

            <span className={styles.catSlug}>/{cat.slug}</span>
            <span className={styles.catCount}>{cat.videoCount} ролик{declension(cat.videoCount)}</span>

            <button
              className={`${styles.catVisBtn} ${cat.visible ? '' : styles.catVisBtnHidden}`}
              onClick={() => toggleVisible(cat)}
              title={cat.visible ? 'Скрыть от пользователей' : 'Показать пользователям'}
            >
              {cat.visible ? 'Видима' : 'Скрыта'}
            </button>

            <button
              className={styles.catDelBtn}
              onClick={() => handleDelete(cat)}
              disabled={cat.videoCount > 0}
              title={cat.videoCount > 0 ? 'Нельзя удалить: есть ролики' : 'Удалить'}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function declension(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return ''
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'а'
  return 'ов'
}
