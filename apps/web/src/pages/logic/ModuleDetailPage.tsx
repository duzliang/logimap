import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { fetchModule, fetchSystem } from '@/api/systems.api'
import { fetchLogicNodes, createLogicNode, updateLogicNode, deleteLogicNode } from '@/api/logicNodes.api'
import type { LogicNode } from '@/types/logic-node.types'
import type { CreateLogicNodeInput, UpdateLogicNodeInput } from '@logimap/types'
import { useAuthStore } from '@/stores/auth.store'
import { NodeApprovalActions } from '@/components/approval/NodeApprovalActions'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@logimap/ui'
import { LogicNodeEditor } from '@/components/editor/LogicNodeEditor'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Pencil, Trash2, FileText, Network, History } from 'lucide-react'
import { LazyVersionHistoryDialog } from '@/components/versions/LazyVersionHistoryDialog'
import { useTranslation } from '@/i18n'
import { nodeStatusLabel, priorityLongLabel } from '@/lib/i18n-labels'

export function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { currentTeamId, teams } = useAuthStore()
  const currentTeam = teams.find((t) => t.id === currentTeamId)
  const userRole = currentTeam?.role || 'VIEWER'
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<LogicNode | null>(null)
  const [isVersionOpen, setIsVersionOpen] = useState(false)
  const [versionNode, setVersionNode] = useState<LogicNode | null>(null)

  const { data: module, isLoading: loadingModule } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId!),
    enabled: !!moduleId
  })

  const { data: system } = useQuery({
    queryKey: ['system', module?.systemId],
    queryFn: () => fetchSystem(module!.systemId),
    enabled: !!module?.systemId
  })

  const { data: nodes = [], isLoading: loadingNodes } = useQuery({
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

  const handleSave = (data: CreateLogicNodeInput | UpdateLogicNodeInput) => {
    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, data: data as UpdateLogicNodeInput })
    } else {
      createMutation.mutate(data as CreateLogicNodeInput)
    }
  }

  const handleEdit = (node: LogicNode) => {
    if (node.status === 'APPROVED') {
      toast.info('已确认节点需先「撤销确认」后才能编辑')
      return
    }
    setEditingNode(node)
    setIsEditorOpen(true)
  }

  const handleDelete = (nodeId: string) => {
    if (confirm(t('logic.deleteConfirm'))) {
      deleteMutation.mutate(nodeId)
    }
  }

  const openNewNodeDialog = () => {
    setEditingNode(null)
    setIsEditorOpen(true)
  }

  const handleOpenVersions = (node: LogicNode) => {
    setVersionNode(node)
    setIsVersionOpen(true)
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

  const listContainerRef = useRef<HTMLDivElement>(null)
  const cardVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 152,
    overscan: 5
  })

  if (loadingModule) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-[var(--color-text-secondary)]">{t('logic.loading')}</div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-[var(--color-text-secondary)]">{t('logic.moduleNotFound')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/systems/${module.systemId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('logic.back')}
            </Button>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{module.name}</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">{module.description || module.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/modules/${moduleId}/graph`)}>
              <Network className="h-4 w-4 mr-2" />
              {t('logic.graphView')}
            </Button>
            <Button onClick={openNewNodeDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t('logic.createNode')}
            </Button>
          </div>
        </div>

        {loadingNodes ? (
          <div className="text-center text-[var(--color-text-secondary)] py-12">{t('logic.loadingNodes')}</div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
            <FileText className="h-16 w-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{t('logic.emptyTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">{t('logic.emptyDesc')}</p>
            <Button onClick={openNewNodeDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t('logic.createNode')}
            </Button>
          </div>
        ) : (
          <div
            ref={listContainerRef}
            className="overflow-auto max-h-[calc(100vh-16rem)] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4"
          >
            <div style={{ height: `${cardVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {cardVirtualizer.getVirtualItems().map((virtualItem) => {
                const node = nodes[virtualItem.index]
                return (
                  <div
                    key={node.id}
                    data-index={virtualItem.index}
                    ref={cardVirtualizer.measureElement}
                    className="absolute left-0 w-full px-2"
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <Card className="hover:shadow-md transition-shadow mb-4">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{node.name}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={
                                node.status === 'APPROVED' ? 'default' :
                                node.status === 'REVIEW' ? 'outline' :
                                node.status === 'DEPRECATED' ? 'destructive' :
                                'secondary'
                              }>
                                {nodeStatusLabel(t, node.status)}
                              </Badge>
                              <Badge variant={
                                node.priority === 'HIGH' ? 'destructive' :
                                node.priority === 'LOW' ? 'secondary' :
                                'outline'
                              }>
                                {priorityLongLabel(t, node.priority)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      {node.summary && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">{node.summary}</p>
                          <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                            <span>
                              {t('logic.branchesCount', { count: node.branches?.length || 0 })} |{' '}
                              {t('logic.edgeCasesCount', { count: node.edgeCases?.length || 0 })}
                            </span>
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
                                title={node.status === 'APPROVED' ? '已确认节点需先「撤销确认」后才能编辑' : '编辑'}
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
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
                : t('logic.createNodeDesc', { module: module.name })}
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
