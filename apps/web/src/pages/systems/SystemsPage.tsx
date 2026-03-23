import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSystems, createSystem, deleteSystem } from '@/api/systems.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Layers, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'

const createSystemSchema = z.object({
  name: z.string().min(1, '请输入系统名称'),
  slug: z.string().regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和连字符'),
  description: z.string().optional()
})

type CreateSystemFormData = z.infer<typeof createSystemSchema>

export function SystemsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems
  })

  const createMutation = useMutation({
    mutationFn: createSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] })
      toast.success('创建成功')
      setIsDialogOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.message || '创建失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] })
      toast.success('删除成功')
    },
    onError: (error) => {
      toast.error(error.message || '删除失败')
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSystemFormData>({
    resolver: zodResolver(createSystemSchema)
  })

  const onSubmit = (data: CreateSystemFormData) => {
    createMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-600">LogiMap</h1>
            <span className="text-gray-400">|</span>
            <h2 className="text-lg font-semibold">系统管理</h2>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建系统
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>创建新系统</DialogTitle>
                  <DialogDescription>
                    创建一个新的业务系统，用于组织和管理相关模块
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="name">
                      系统名称
                    </label>
                    <Input
                      id="name"
                      placeholder="例如：4S 店运营管理系统"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="slug">
                      系统标识
                    </label>
                    <Input
                      id="slug"
                      placeholder="例如：4s-store-management"
                      {...register('slug')}
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-500">{errors.slug.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="description">
                      系统描述
                    </label>
                    <Input
                      id="description"
                      placeholder="可选"
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? '创建中...' : '创建'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">加载中...</div>
          </div>
        ) : systems.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无系统</h3>
            <p className="text-gray-500 mb-4">创建第一个系统来开始管理您的业务逻辑</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建系统
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {systems.map((system) => (
              <Card key={system.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: system.color || '#1A56A8' }}
                      >
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{system.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {system.modulesCount || 0} 个模块
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {system.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">{system.description}</p>
                  </CardContent>
                )}
                <CardFooter className="pt-0 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/systems/${system.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    进入系统
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 编辑功能待实现
                        toast.info('编辑功能待实现')
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`确定要删除系统"${system.name}"吗？`)) {
                          deleteMutation.mutate(system.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
