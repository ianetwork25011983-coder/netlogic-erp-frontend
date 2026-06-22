import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const { isAuthenticated, fetchMe } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) fetchMe()
  }, [])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-[#070d1a]">
      <Sidebar />
      <main className="flex-1 ml-60 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
