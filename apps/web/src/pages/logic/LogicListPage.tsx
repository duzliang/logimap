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
import { fetchModule, fetchSystem } from '@/api/systems.api'
import type { LogicNode } from '@/types/logic-node.types'
import type { Branch, EdgeCase, CreateLogicNodeInput, UpdateLogicNodeInput } from '@logimap/types'
import { useAuthStore } from '@/stores/auth.store'
import { NodeApprovalActions } from '@/components/approval/NodeApprovalActions'
import { Button, Input, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@logimap/ui'
import { LogicNodeEditor } from '@/components/editor/LogicNodeEditor'
import { toast } from 'sonner'
import { Pencil, Trash2, FileText, ArrowLeft, Network, Plus, History } from 'lucide-react'
import { VersionHistoryDialog } from '@/components/versions/VersionHistoryDialog'

export function LogicListPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentTeamId, teams } = useAuthStore()
  const currentTeam = teams.find((t) => t.id === currentTeamId)
  const userRole = currentTeam?.role || 'VIEWER'
  const [search, setSearch] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<LogicNode | null>(null)
  const [isVersionOpen, setIsVersionOpen] = useState(false)
  const [versionNode, setVersionNode] = useState<LogicNode | null>(null)

  const { data: module } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId!),
    enabled: !!moduleId
  })

  const { data: system } = useQuery({
    queryKey: ['system', module?.systemId],
    queryFn: () => fetchSystem(module!.systemId),
    enabled: !!module?.systemId
  })

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['logicNodes', moduleId],
    queryFn: () => fetchLogicNodes(moduleId!),
    enabled: !!moduleId
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

  function handleOpenVersions(node: LogicNode) {
    setVersionNode(node)
    setIsVersionOpen(true)
  }

  const handleSave = (data: CreateLogicNodeInput | UpdateLogicNodeInput) => {
    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, data: data as UpdateLogicNodeInput })
    } else {
      createMutation.mutate(data as CreateLogicNodeInput)
    }
  }

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
      cell: ({ getValue }) => (getValue() as Branch[])?.length || 0
    },
    {
      accessorKey: 'edgeCases',
      header: '边界条件',
      cell: ({ getValue }) => {
        const edgeCases = getValue() as EdgeCase[]
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
      cell: ({ row }) => {
        const node = row.original
        const canEdit = node.status !== 'APPROVED'
        return (
          <div className="flex items-center gap-2">
            <NodeApprovalActions node={node} userRole={userRole} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenVersions(node)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(node)}
              disabled={!canEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(node.id)}
              className="text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
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
        <div className="text-center text-[var(--color-text-secondary)]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/systems/${module?.systemId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{module?.name || '逻辑节点管理'}</h1>
              {module?.description && (
                <p className="text-sm text-[var(--color-text-secondary)]">{module.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/modules/${moduleId}/graph`)}>
              <Network className="h-4 w-4 mr-2" />
              图谱视图
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建节点
            </Button>
          </div>
        </div>

        <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] shadow-card p-5">
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
                  <tr key={headerGroup.id} className="border-b border-[var(--color-border-default)]">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="h-12 px-4 text-left align-middle font-medium text-[var(--color-text-secondary)]"
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
                  <tr key={row.id} className="border-b border-[var(--color-border-default)] hover:bg-[var(--color-bg-base)]">
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
              <div className="text-center text-[var(--color-text-secondary)] py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
                <p>暂无节点数据</p>
              </div>
            )}
          </div>
        </div>
      </main>

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
            nodeId={editingNode?.id}
            onSave={handleSave}
            onCancel={() => setIsEditorOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
            teamId={currentTeamId || undefined}
            moduleContext={module?.name}
            repo={system ? { repoUrl: system.repoUrl, repoBranch: system.repoBranch } : undefined}
          />
        </DialogContent>
      </Dialog>
      <VersionHistoryDialog
        nodeId={versionNode?.id || ''}
        nodeName={versionNode?.name || ''}
        open={isVersionOpen}
        onOpenChange={setIsVersionOpen}
        onRestore={() => queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })}
      />
    </div>
  )
}
