import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table'
import { fetchLogicNodes, createLogicNode, updateLogicNode, deleteLogicNode } from '@/api/logicNodes.api'
import { fetchModule } from '@/api/systems.api'
import type { LogicNode, CreateLogicNodeInput, UpdateLogicNodeInput } from '@/types/logic-node.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { LogicNodeEditor } from '@/components/editor/LogicNodeEditor'
import { toast } from 'sonner'
import { Pencil, Trash2, FileText, ArrowLeft, Network } from 'lucide-react'

export function LogicListPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<LogicNode | null>(null)

  // 加载模块信息
  const { data: module } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId!),
    enabled: !!moduleId
  })

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['logicNodes', moduleId],
    queryFn: () => fetchLogicNodes(moduleId!)
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateLogicNodeInput) => createLogicNode(moduleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })
      toast.success('创建成功')
      setIsEditorOpen(false)
      setEditingNode(null)
    },
    onError: (error) => {
      toast.error(error.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLogicNodeInput }) =>
      updateLogicNode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })
      queryClient.invalidateQueries({ queryKey: ['logicNode', editingNode?.id] })
      toast.success('更新成功')
      setIsEditorOpen(false)
      setEditingNode(null)
    },
    onError: (error) => {
      toast.error(error.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLogicNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })
      toast.success('删除成功')
    },
    onError: (error) => {
      toast.error(error.message || '删除失败')
    }
  })

  function handleDelete(nodeId: string) {
    if (confirm('确定要删除此节点吗？')) {
      deleteMutation.mutate(nodeId)
    }
  }

  function handleEdit(node: LogicNode) {
    setEditingNode(node)
    setIsEditorOpen(true)
  }

  function handleCreate() {
    setEditingNode(null)
    setIsEditorOpen(true)
  }

  const handleSave = (data: CreateLogicNodeInput | UpdateLogicNodeInput) => {
    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, data: data as UpdateLogicNodeInput })
    } else {
      createMutation.mutate(data as CreateLogicNodeInput)
    }
  }

  // 转换 LogicNode 为 LogicNodeForm 类型
  const getNodeForm = (node: LogicNode) => ({
    name: node.name,
    summary: node.summary || undefined,
    trigger: node.trigger || undefined,
    dependsOn: node.dependsOn || undefined,
    mainFlow: node.mainFlow || undefined,
    branches: node.branches || [],
    edgeCases: node.edgeCases || [],
    codeRef: node.codeRef || undefined,
    tags: node.tags || [],
    notes: node.notes || undefined
  })

  const filteredNodes = nodes.filter((node) =>
    node.name.toLowerCase().includes(search.toLowerCase())
  )

  const columns: ColumnDef<LogicNode>[] = [
    {
      accessorKey: 'name',
      header: '节点名称'
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ getValue }) => {
        const status = getValue() as LogicNode['status']
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'draft' | 'review' | 'approved' | 'deprecated' }> = {
          DRAFT: { label: '草稿', variant: 'draft' },
          REVIEW: { label: '待评审', variant: 'review' },
          APPROVED: { label: '已确认', variant: 'approved' },
          DEPRECATED: { label: '已废弃', variant: 'deprecated' }
        }
        const config = statusMap[status] || { label: status, variant: 'secondary' }
        return <Badge variant={config.variant}>{config.label}</Badge>
      }
    },
    {
      accessorKey: 'priority',
      header: '优先级',
      cell: ({ getValue }) => {
        const priority = getValue() as LogicNode['priority']
        const priorityMap: Record<string, string> = {
          HIGH: '高',
          NORMAL: '中',
          LOW: '低'
        }
        return <span>{priorityMap[priority] || priority}</span>
      }
    },
    {
      accessorKey: 'branches',
      header: '分支数',
      cell: ({ getValue }) => (getValue() as any[])?.length || 0
    },
    {
      accessorKey: 'edgeCases',
      header: '边界条件',
      cell: ({ getValue }) => {
        const edgeCases = getValue() as any[]
        const criticalCount = edgeCases?.filter((e) => e.severity === 'critical').length || 0
        return (
          <div className="flex gap-1">
            <span>{edgeCases?.length || 0}</span>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">{criticalCount}</Badge>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'updatedAt',
      header: '最后更新',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString('zh-CN')
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: filteredNodes,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/systems/${module?.systemId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">{module?.name || '逻辑节点管理'}</h1>
              {module?.description && (
                <p className="text-sm text-neutral-500">{module.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/modules/${moduleId}/graph`)}>
              <Network className="h-4 w-4 mr-2" />
              图谱视图
            </Button>
            <Button onClick={handleCreate}>
              创建节点
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="搜索节点名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-neutral-200">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="h-12 px-4 text-left align-middle font-medium text-neutral-500"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {table.getRowModel().rows.length === 0 && (
              <div className="text-center text-neutral-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>暂无节点数据</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 节点编辑器 Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? '编辑节点' : '创建新节点'}
            </DialogTitle>
            <DialogDescription>
              {editingNode
                ? `编辑：${editingNode.name}`
                : `在"${module?.name || ''}"下创建逻辑节点`}
            </DialogDescription>
          </DialogHeader>
          <LogicNodeEditor
            node={editingNode ? getNodeForm(editingNode) : undefined}
            onSave={handleSave}
            onCancel={() => setIsEditorOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}