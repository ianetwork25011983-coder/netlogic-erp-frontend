import { create } from 'zustand'
import api from '@/lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const me = await api.get('/auth/me/')
    set({ user: me.data, isAuthenticated: true })
    return me.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me/')
      set({ user: data, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
