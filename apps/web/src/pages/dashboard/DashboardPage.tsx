import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { fetchMe } from '@/api/auth.api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, ArrowRight } from 'lucide-react'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setUser, setToken, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        logout()
        navigate('/login')
        return
      }

      try {
        const userData = await fetchMe()
        setUser(userData)
      } catch (error) {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        toast.error('会话已过期，请重新登录')
        navigate('/login')
      } finally {
        setIsChecking(false)
      }
    }

    initAuth()
  }, [navigate, setUser, setToken, logout])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">LogiMap</h1>
          <p className="text-gray-500 mt-2">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">LogiMap</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">欢迎，{user.name}</span>
            <button
              onClick={() => {
                localStorage.removeItem('token')
                setUser(null)
                navigate('/login')
                toast.success('已退出登录')
              }}
              className="text-sm text-red-600 hover:underline"
            >
              退出
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">欢迎使用 LogiMap</h2>
          <p className="text-gray-600">业务逻辑管理系统 - Phase 2 已完成</p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/systems')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>系统管理</CardTitle>
                  <CardDescription>管理业务系统和模块</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>创建和管理您的业务系统</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
