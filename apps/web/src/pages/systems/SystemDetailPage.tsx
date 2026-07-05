import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateModuleSchema, type CreateModuleInput } from '@logimap/types'
import { fetchSystem } from '@/api/systems.api'
import { fetchModules, createModule, deleteModule } from '@/api/systems.api'
import { Button, Input, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@logimap/ui'
import { toast } from 'sonner'
import { Package, Plus, Trash2, ArrowLeft, FileText } from 'lucide-react'

export function SystemDetailPage() {
  const { systemId } = useParams<{ systemId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: system, isLoading: loadingSystem } = useQuery({
    queryKey: ['system', systemId],
    queryFn: () => fetchSystem(systemId!),
    enabled: !!systemId
  })

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['modules', systemId],
    queryFn: () => fetchModules(systemId!),
    enabled: !!systemId
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateModuleInput) => createModule(systemId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', systemId] })
      toast.success('创建成功')
      setIsDialogOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.message || '创建失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', systemId] })
      toast.success('删除成功')
    },
    onError: (error) => {
      toast.error(error.message || '删除失败')
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateModuleInput>({
    resolver: zodResolver(CreateModuleSchema)
  })

  const onSubmit = (data: CreateModuleInput) => {
    createMutation.mutate(data)
  }

  if (loadingSystem) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-[var(--color-text-secondary)]">加载中...</div>
      </div>
    )
  }

  if (!system) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-[var(--color-text-secondary)]">系统不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/systems')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded flex items-center justify-center"
                style={{ backgroundColor: system.color || 'var(--color-brand-default)' }}
              >
                <Package className="h-4 w-4 text-[var(--color-text-inverse)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{system.name}</h1>
                <p className="text-xs text-[var(--color-text-secondary)]">{system.slug}</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建模块
          </Button>
        </div>

        {system.description && (
          <div className="mb-6 p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
            <p className="text-sm text-[var(--color-text-secondary)]">{system.description}</p>
          </div>
        )}

        {loadingModules ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-[var(--color-text-secondary)]">加载模块列表...</div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
            <Package className="h-16 w-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">暂无模块</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">创建第一个模块来开始管理业务逻辑</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建模块
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded flex items-center justify-center"
                        style={{ backgroundColor: module.color || 'var(--color-brand-default)' }}
                      >
                        <Package className="h-4 w-4 text-[var(--color-text-inverse)]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {module.nodesCount || 0} 个逻辑节点
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {module.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{module.description}</p>
                  </CardContent>
                )}
                <CardFooter className="pt-0 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/modules/${module.id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    管理模块
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`确定要删除模块"${module.name}"吗？`)) {
                        deleteMutation.mutate(module.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
              <DialogTitle>创建新模块</DialogTitle>
              <DialogDescription>
                在"{system.name}"下创建业务模块
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="name">
                  模块名称
                </label>
                <Input
                  id="name"
                  placeholder="例如：售后维修管理"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-[var(--color-error-icon)]">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="slug">
                  模块标识
                </label>
                <Input
                  id="slug"
                  placeholder="例如：after-sales-service"
                  {...register('slug')}
                />
                {errors.slug && (
                  <p className="text-sm text-[var(--color-error-icon)]">{errors.slug.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="description">
                  模块描述
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
