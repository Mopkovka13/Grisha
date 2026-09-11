import axios from 'axios'

export interface BlockText {
  slug: string
  heading: string | null
  body: string | null
}

export const blockTextApi = {
  /** Never 404s — an unedited block comes back with empty strings */
  get: (slug: string): Promise<BlockText> =>
    axios.get(`/api/block-texts/${slug}`).then(res => res.data),

  update: (slug: string, heading: string, body: string, token: string): Promise<BlockText> =>
    axios.put(`/api/admin/block-texts/${slug}`, {}, {
      params: { heading, body },
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),
}
