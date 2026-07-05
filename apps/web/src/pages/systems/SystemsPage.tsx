import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSystemSchema, type CreateSystemInput } from '@logimap/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSystems, createSystem, deleteSystem } from '@/api/systems.api'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@logimap/ui'
import { toast } from 'sonner'
import { Layers, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'

export function SystemsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const currentTeamId = useAuthStore((state) => state.currentTeamId)

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['systems', currentTeamId],
    queryFn: () => fetchSystems(currentTeamId || undefined),
    enabled: !!currentTeamId
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateSystemInput) => {
      if (!currentTeamId) throw new Error('未选择团队')
      return createSystem(data, currentTeamId)
    },
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSystemInput>({
    resolver: zodResolver(CreateSystemSchema)
  })

  const onSubmit = (data: CreateSystemInput) => {
    createMutation.mutate(data)
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">系统管理</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">创建和管理业务系统与模块</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建系统
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-[var(--color-text-secondary)]">加载中...</div>
          </div>
        ) : systems.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
            <Layers className="h-16 w-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">暂无系统</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">创建第一个系统来开始管理您的业务逻辑</p>
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
                        style={{ backgroundColor: system.color || 'var(--color-brand-default)' }}
                      >
                        <Layers className="h-5 w-5 text-[var(--color-text-inverse)]" />
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
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{system.description}</p>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <p className="text-sm text-[var(--color-error-icon)]">{errors.name.message}</p>
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
                  <p className="text-sm text-[var(--color-error-icon)]">{errors.slug.message}</p>
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
                  <p className="text-sm text-[var(--color-error-icon)]">{errors.description.message}</p>
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
  )
}
