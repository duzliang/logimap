import { useState, useMemo } from 'react'
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
import { LazyVersionHistoryDialog } from '@/components/versions/LazyVersionHistoryDialog'
import { useTranslation } from '@/i18n'
import { nodeStatusLabel, priorityLabel } from '@/lib/i18n-labels'

export function LogicListPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
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
      toast.success(t('logic.createSuccess'))
      setIsEditorOpen(false)
      setEditingNode(null)
    },
    onError: (error) => {
      toast.error(error.message || t('logic.createFailed'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLogicNodeInput }) =>
      updateLogicNode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })
      queryClient.invalidateQueries({ queryKey: ['logicNode', editingNode?.id] })
      toast.success(t('logic.updateSuccess'))
      setIsEditorOpen(false)
      setEditingNode(null)
    },
    onError: (error) => {
      toast.error(error.message || t('logic.updateFailed'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLogicNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })
      toast.success(t('logic.deleteSuccess'))
    },
    onError: (error) => {
      toast.error(error.message || t('logic.deleteFailed'))
    }
  })

  function handleDelete(nodeId: string) {
    if (confirm(t('logic.deleteConfirm'))) {
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

  // 必须 memoize：columns 若每次渲染都新建，flexRender 会把 cell 当作新组件类型，
  // 导致单元格子树（含 NodeApprovalActions 的审批弹窗状态）在每次渲染时被卸载重挂，
  // 表现为点击「提交评审/通过」后弹窗一闪即失。deps 为 userRole + t（语言切换需刷新表头/标签）；
  // 闭包内的 handleEdit/handleDelete/handleOpenVersions 只调用稳定的 setState / mutate。
  const columns = useMemo<ColumnDef<LogicNode>[]>(() => [
    {
      accessorKey: 'name',
      header: t('logic.colName')
    },
    {
      accessorKey: 'status',
      header: t('logic.colStatus'),
      cell: ({ getValue }) => {
        const status = getValue() as LogicNode['status']
        const variantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive' | 'draft' | 'review' | 'approved' | 'deprecated'> = {
          DRAFT: 'draft',
          REVIEW: 'review',
          APPROVED: 'approved',
          DEPRECATED: 'deprecated'
        }
        return <Badge variant={variantMap[status] || 'secondary'}>{nodeStatusLabel(t, status)}</Badge>
      }
    },
    {
      accessorKey: 'priority',
      header: t('logic.colPriority'),
      cell: ({ getValue }) => {
        const priority = getValue() as LogicNode['priority']
        return <span>{priorityLabel(t, priority)}</span>
      }
    },
    {
      accessorKey: 'branches',
      header: t('logic.colBranches'),
      cell: ({ getValue }) => (getValue() as Branch[])?.length || 0
    },
    {
      accessorKey: 'edgeCases',
      header: t('logic.colEdgeCases'),
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
      header: t('logic.colUpdatedAt'),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString()
    },
    {
      id: 'actions',
      header: t('logic.colActions'),
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
  ], [userRole, t])

  const table = useReactTable({
    data: filteredNodes,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-[var(--color-text-secondary)]">{t('logic.loading')}</div>
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
              {t('logic.back')}
            </Button>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{module?.name || t('logic.defaultTitle')}</h1>
              {module?.description && (
                <p className="text-sm text-[var(--color-text-secondary)]">{module.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/modules/${moduleId}/graph`)}>
              <Network className="h-4 w-4 mr-2" />
              {t('logic.graphView')}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('logic.createNode')}
            </Button>
          </div>
        </div>

        <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] shadow-card p-5">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder={t('logic.searchNodePlaceholder')}
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
                <p>{t('logic.emptyTable')}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? t('logic.editNode') : t('logic.createNodeTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingNode
                ? t('logic.editNodeDesc', { name: editingNode.name })
                : t('logic.createNodeDesc', { module: module?.name || '' })}
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
      <LazyVersionHistoryDialog
        nodeId={versionNode?.id || ''}
        nodeName={versionNode?.name || ''}
        open={isVersionOpen}
        onOpenChange={setIsVersionOpen}
        onRestore={() => queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })}
      />
    </div>
  )
}
