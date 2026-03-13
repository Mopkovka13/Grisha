import axios from 'axios'

export interface ServiceResponse {
  id: number
  title: string
  description: string | null
  price: string | null
  sortOrder: number
}

const apiClient = axios.create({ baseURL: '/api' })

export const serviceApi = {
  getServices: (): Promise<ServiceResponse[]> =>
    apiClient.get('/services').then(r => r.data),

  createService: (
    title: string,
    description: string,
    price: string,
    token: string
  ): Promise<ServiceResponse> =>
    apiClient.post('/admin/services', null, {
      params: { title, description, price },
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.data),

  updateService: (
    id: number,
    title: string,
    description: string,
    price: string,
    token: string
  ): Promise<ServiceResponse> =>
    apiClient.put(`/admin/services/${id}`, null, {
      params: { title, description, price },
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.data),

  deleteService: (id: number, token: string): Promise<void> =>
    apiClient.delete(`/admin/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => undefined),

  reorderServices: (orderedIds: number[], token: string): Promise<void> =>
    apiClient.put('/admin/services/reorder', { orderedIds }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => undefined),
}
