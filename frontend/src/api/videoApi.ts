import axios from 'axios'

const API_BASE = '/api'

export interface VideoResponse {
  id: number
  title: string
  thumbnailPath: string | null
  previewPath: string | null
  hlsPath: string | null
  durationSeconds: number | null
  width: number | null
  height: number | null
  status: string
  progress: number
  category: string
  createdAt: string
}

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const videoApi = {
  getVideosByCategory: (category: string): Promise<VideoResponse[]> => {
    return apiClient.get(`/videos`, { params: { category } }).then(res => res.data)
  },

  getAllVideos: (): Promise<VideoResponse[]> => {
    return apiClient.get(`/videos`).then(res => res.data)
  },

  getVideo: (id: number): Promise<VideoResponse> => {
    return apiClient.get(`/videos/${id}`).then(res => res.data)
  },

  getStreamUrl: (id: number): Promise<string> => {
    return apiClient.get(`/stream/${id}`).then(res => res.data)
  },

  // Admin endpoints
  login: (password: string): Promise<{ token: string; type: string }> => {
    return apiClient.post(`/admin/login`, { password }).then(res => res.data)
  },

  getAllVideosAdmin: (token: string): Promise<VideoResponse[]> => {
    return apiClient.get(`/admin/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data)
  },

  uploadVideo: (file: File, title: string, category: string, token: string): Promise<VideoResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('category', category)

    return apiClient.post(`/admin/videos/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }).then(res => res.data)
  },

  deleteVideo: (id: number, token: string): Promise<void> => {
    return apiClient.delete(`/admin/videos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => undefined)
  },

  updateVideo: (id: number, title: string, token: string): Promise<VideoResponse> => {
    return apiClient.put(`/admin/videos/${id}`, {}, {
      params: { title },
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data)
  },

  reorderVideos: (orderedIds: number[], token: string): Promise<void> => {
    return apiClient.put(`/admin/videos/reorder`, { orderedIds }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => undefined)
  },
}

export default videoApi
