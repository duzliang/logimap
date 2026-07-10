import { useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toPng, toSvg } from 'html-to-image'
import {
  buildGraphMarkdown,
  slugForFile,
  downloadDataUrl,
  downloadText,
  exportImageAsPdf
} from '@/lib/graph-export'
import type { GraphExportFormat } from './GraphExportMenu'
import dagre from '@dagrejs/dagre'
import { fetchGraphData, updateNodePosition, createConnection, type GraphConnection } from '@/api/graph.api'
import { fetchModule } from '@/api/systems.api'
import { updateConnection, deleteConnection } from '@/api/connection.api'
import { search } from '@/api/search.api'
import type { Branch, EdgeCase, ConnectionType, LogicNodeStatus, NodePriority } from '@logimap/types'
import { LogicNodeComponent } from './LogicNode'
import { LogicEdge } from './LogicEdge'
import { GraphToolbar } from './GraphToolbar'
import { EdgeEditDialog } from './EdgeEditDialog'
import { NodeDetailDialog } from './NodeDetailDialog'
import { ImpactAnalysisDialog } from '@/components/impact/ImpactAnalysisDialog'
import { toast } from 'sonner'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button, EmptyState, Skeleton } from '@logimap/ui'
import { useAuthStore } from '@/stores/auth.store'
import type { ImpactScope } from '@logimap/types'

const nodeTypes: NodeTypes = {
  logicNode: LogicNodeComponent
}

const edgeTypes: EdgeTypes = {
  default: LogicEdge
}

interface EdgeData {
  id: string
  sourceId: string
  targetId: string
  type: ConnectionType
  label?: string
}

interface NodeDetailData {
  id: string
  name: string
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches?: Branch[]
  edgeCases?: EdgeCase[]
  status: LogicNodeStatus
  priority: NodePriority
  moduleId: string
}

const nodeWidth = 220
const nodeHeight = 150

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 80 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

// 内部组件 - 使用 React Flow hooks
function LogicGraphInner() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { fitView } = useReactFlow()
  const flowRef = useRef<HTMLDivElement>(null)
  const { currentTeamId, teams } = useAuthStore()
  const currentTeam = teams.find((t) => t.id === currentTeamId)
  const userRole = currentTeam?.role || 'VIEWER'

  const q = searchParams.get('q') ?? ''
  const statuses = searchParams.get('statuses') ?? ''
  const priorities = searchParams.get('priorities') ?? ''
  const tags = searchParams.get('tags') ?? ''
  const assigneeId = searchParams.get('assigneeId') ?? ''
  const highlightNodeIds = searchParams.get('highlightNodeIds') ?? ''

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeDetailData | null>(null)
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false)
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false)
  const [isImpactDialogOpen, setIsImpactDialogOpen] = useState(false)
  const [whatIfScope, setWhatIfScope] = useState<ImpactScope | null>(null)
  const [isWhatIfMode, setIsWhatIfMode] = useState(false)

  // 加载模块信息
  const { data: module } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId!),
    enabled: !!moduleId
  })

  // 加载图谱数据
  const { data: graphData, isLoading } = useQuery({
    queryKey: ['graph', moduleId],
    queryFn: () => fetchGraphData(moduleId!),
    enabled: !!moduleId
  })

  // 根据 URL 搜索参数高亮匹配节点
  const { data: matchedNodeIds = [] } = useQuery({
    queryKey: ['graph-search', moduleId, q, statuses, priorities, tags, assigneeId, highlightNodeIds],
    queryFn: async () => {
      if (highlightNodeIds) {
        return highlightNodeIds.split(',').filter(Boolean)
      }
      if (!q && !statuses && !priorities && !tags && !assigneeId) {
        return []
      }
      const response = await search({
        type: 'node',
        moduleId: moduleId!,
        q,
        statuses: statuses.split(',').filter(Boolean),
        priorities: priorities.split(',').filter(Boolean),
        tags: tags.split(',').filter(Boolean),
        assigneeId,
        limit: 1000
      })
      return response.nodes.items.map((node) => node.id)
    },
    enabled: !!moduleId
  })

  // 更新节点位置 mutation
  const updatePositionMutation = useMutation({
    mutationFn: ({ nodeId, x, y }: { nodeId: string; x: number; y: number }) =>
      updateNodePosition(nodeId, x, y),
    onError: () => {
      toast.error('保存节点位置失败')
    }
  })

  // 创建连线 mutation
  const createConnectionMutation = useMutation({
    mutationFn: (data: { source: string; target: string; type?: string }) =>
      createConnection(data.source, data.target, data.type || 'TRIGGERS'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', moduleId] })
      toast.success('连线创建成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建连线失败')
    }
  })

  // 更新连线 mutation
  const updateConnectionMutation = useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: { type: ConnectionType; label?: string } }) =>
      updateConnection(connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', moduleId] })
      toast.success('连线更新成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新连线失败')
    }
  })

  // 删除连线 mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: (connectionId: string) => deleteConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', moduleId] })
      toast.success('连线已删除')
      setIsEdgeDialogOpen(false)
      setSelectedEdge(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除连线失败')
    }
  })

  // 转换图谱数据为 React Flow 格式
  useEffect(() => {
    if (graphData) {
      const searchHighlightSet = new Set(matchedNodeIds)
      // 影响分析的三层作用域 = BFS 图距（hop 1/2/3），用于墨滴涟漪的逐层错峰
      const impactHopById = new Map<string, number>()
      if (whatIfScope) {
        // 源节点自己应为焦点（hop 0），不应被云雾雾化
        impactHopById.set(whatIfScope.startNodeId, 0)
        whatIfScope.direct.forEach((n) => impactHopById.set(n.id, 1))
        whatIfScope.indirect.forEach((n) => { if (!impactHopById.has(n.id)) impactHopById.set(n.id, 2) })
        whatIfScope.thirdLevel.forEach((n) => { if (!impactHopById.has(n.id)) impactHopById.set(n.id, 3) })
      }
      const impactNodeIds = new Set(impactHopById.keys())
      const hasSearchHighlight = searchHighlightSet.size > 0
      const hasImpactHighlight = impactNodeIds.size > 0
      const highlightSet = hasImpactHighlight ? impactNodeIds : searchHighlightSet
      const hasHighlight = hasSearchHighlight || hasImpactHighlight

      const flowNodes: Node[] = graphData.nodes.map((node) => ({
        id: node.id,
        type: 'logicNode',
        position: { x: node.positionX || 0, y: node.positionY || 0 },
        data: {
          ...node,
          highlighted: hasHighlight && highlightSet.has(node.id),
          dimmed: hasHighlight && !highlightSet.has(node.id),
          impactHop: hasImpactHighlight ? impactHopById.get(node.id) : undefined,
          whatIf: isWhatIfMode
        } as unknown as Record<string, unknown>
      }))

      const flowEdges: Edge[] = graphData.connections.map((conn) => {
        const sourceHighlighted = highlightSet.has(conn.sourceId)
        const targetHighlighted = highlightSet.has(conn.targetId)
        return {
          id: conn.id,
          source: conn.sourceId,
          target: conn.targetId,
          type: 'default',
          data: {
            connectionType: conn.type,
            label: conn.label || undefined,
            highlighted: hasHighlight && (sourceHighlighted || targetHighlighted),
            dimmed: hasHighlight && !sourceHighlighted && !targetHighlighted
          } as Record<string, unknown>
        }
      })

      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [graphData, matchedNodeIds, whatIfScope, isWhatIfMode])

  // 处理节点拖拽结束
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updatePositionMutation.mutate({
        nodeId: node.id,
        x: node.position.x,
        y: node.position.y
      })
    },
    [updatePositionMutation]
  )

  // 处理连线创建
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        createConnectionMutation.mutate({
          source: params.source,
          target: params.target,
          type: 'TRIGGERS'
        })
      }
    },
    [createConnectionMutation]
  )

  // 处理边点击
  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => {
      const conn = graphData?.connections.find((c: GraphConnection) => c.id === edge.id)
      if (conn) {
        setSelectedEdge({
          id: conn.id,
          sourceId: conn.sourceId,
          targetId: conn.targetId,
          type: conn.type,
          label: conn.label || undefined
        })
        setIsEdgeDialogOpen(true)
      }
    },
    [graphData]
  )

  // 处理节点单击：同时更新工具栏可用的 selectedNode
  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as unknown as NodeDetailData
      setSelectedNode(data)
    },
    []
  )

  // 处理节点双击
  const onNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as unknown as NodeDetailData
      setSelectedNode(data)
      setIsNodeDialogOpen(true)
    },
    []
  )

  // 处理连线更新
  const handleEdgeSave = (data: { type: ConnectionType; label?: string }) => {
    if (selectedEdge) {
      updateConnectionMutation.mutate({
        connectionId: selectedEdge.id,
        data
      })
    }
  }

  // 处理连线删除
  const handleEdgeDelete = () => {
    if (selectedEdge) {
      deleteConnectionMutation.mutate(selectedEdge.id)
    }
  }

  const handleCreateNode = () => {
    navigate(`/modules/${moduleId}/nodes`)
  }

  // 自动布局
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)

    // 保存所有节点的新位置
    layoutedNodes.forEach((node) => {
      updatePositionMutation.mutate({
        nodeId: node.id,
        x: node.position.x,
        y: node.position.y
      })
    })

    fitView({ padding: 0.2 })
    toast.success('自动布局完成')
  }, [nodes, edges, setNodes, setEdges, updatePositionMutation, fitView])

  // 导出（PNG / SVG / PDF / Markdown）
  const handleExport = useCallback(
    async (format: GraphExportFormat) => {
      const base = slugForFile(module?.name || 'graph')
      try {
        if (format === 'markdown') {
          if (!graphData) return
          downloadText(buildGraphMarkdown(graphData, module?.name || '逻辑图谱'), `${base}.md`, 'text/markdown;charset=utf-8')
          toast.success('Markdown 导出成功')
          return
        }

        if (!flowRef.current) return

        if (format === 'svg') {
          const dataUrl = await toSvg(flowRef.current, { backgroundColor: 'var(--color-bg-base)' })
          downloadDataUrl(dataUrl, `${base}.svg`)
          toast.success('SVG 导出成功')
          return
        }

        // png / pdf 都基于 PNG 渲染
        const pngUrl = await toPng(flowRef.current, { backgroundColor: 'var(--color-bg-base)', quality: 1.0 })
        if (format === 'pdf') {
          const ok = exportImageAsPdf(pngUrl, base)
          if (ok) toast.success('已打开打印窗口，请选择「另存为 PDF」')
          else toast.error('无法打开打印窗口，请检查浏览器弹窗拦截')
          return
        }

        downloadDataUrl(pngUrl, `${base}.png`)
        toast.success('图片导出成功')
      } catch (error) {
        toast.error('导出失败')
      }
    },
    [module?.name, graphData]
  )

  const handleToggleListView = () => {
    navigate(`/modules/${moduleId}/nodes`)
  }

  const handleFitView = () => {
    fitView({ padding: 0.2 })
  }

  const handleImpactAnalysis = () => {
    if (selectedNode) {
      setIsNodeDialogOpen(false)
      setIsImpactDialogOpen(true)
    }
  }

  const handleWhatIfMode = () => {
    setIsWhatIfMode((prev) => {
      if (prev) {
        setWhatIfScope(null)
      }
      return !prev
    })
  }

  const moduleNodes = graphData?.nodes.map((n) => ({ id: n.id, name: n.name })) ?? []

  if (isLoading) {
    // 呼吸骨架：形状忠实于节点卡轮廓，减少加载完成时的布局跳动
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[var(--color-bg-base)]">
        <div className="flex items-start gap-10">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex flex-col gap-6" style={{ marginTop: col === 1 ? 40 : 0 }}>
              {[0, 1].map((row) => (
                <div key={row} className="w-[220px] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-3 shadow-node">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="mb-2 h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isEmpty = (graphData?.nodes.length ?? 0) === 0

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-[var(--color-bg-base)]">
      <GraphToolbar
        onCreateNode={handleCreateNode}
        onAutoLayout={handleAutoLayout}
        onFitView={handleFitView}
        onExport={handleExport}
        onToggleListView={handleToggleListView}
        onImpactAnalysis={() => {
          if (selectedNode) {
            setIsNodeDialogOpen(false)
            setIsImpactDialogOpen(true)
          } else {
            toast.info('请先选择一个节点')
          }
        }}
        onWhatIfMode={handleWhatIfMode}
        isWhatIfMode={isWhatIfMode}
      />

      {/* 返回按钮 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Button variant="outline" size="sm" onClick={() => navigate(`/systems/${module?.systemId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回系统
        </Button>
      </div>

      <div ref={flowRef} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          minZoom={0.25}
          maxZoom={2}
        >
          <Background gap={20} size={1} color="var(--color-border-default)" />
          <Controls className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-sm" />
          <MiniMap
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-sm"
            nodeColor={(node) => {
              const status = node.data?.status
              if (status === 'APPROVED') return 'var(--color-success-icon)'
              if (status === 'REVIEW') return 'var(--color-warning-icon)'
              if (status === 'DEPRECATED') return 'var(--color-error-icon)'
              return 'var(--color-text-tertiary)'
            }}
          />
        </ReactFlow>
      </div>

      {/* 空状态：留白即款待 —— 衬线引导语 + 单一主操作 */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto">
            <EmptyState
              message="纸墨已备，画下第一个节点。"
              action={
                <Button onClick={handleCreateNode}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建节点
                </Button>
              }
            />
          </div>
        </div>
      )}

      {/* 连线编辑对话框 */}
      <EdgeEditDialog
        open={isEdgeDialogOpen}
        onOpenChange={setIsEdgeDialogOpen}
        edgeData={selectedEdge}
        onSave={handleEdgeSave}
        onDelete={handleEdgeDelete}
      />

      {/* 节点详情对话框 */}
      <NodeDetailDialog
        open={isNodeDialogOpen}
        onOpenChange={setIsNodeDialogOpen}
        nodeData={selectedNode}
        userRole={userRole}
        onEdit={() => {
          setIsNodeDialogOpen(false)
          navigate(`/modules/${moduleId}/nodes?edit=${selectedNode?.id}`)
        }}
        onStatusChange={() => {
          queryClient.invalidateQueries({ queryKey: ['graph', moduleId] })
        }}
        onImpactAnalysis={handleImpactAnalysis}
      />

      <ImpactAnalysisDialog
        open={isImpactDialogOpen}
        onOpenChange={setIsImpactDialogOpen}
        nodeId={selectedNode?.id ?? ''}
        moduleId={moduleId ?? ''}
        nodeName={selectedNode?.name ?? ''}
        moduleNodes={moduleNodes}
        onScopeChange={(scope) => {
          setWhatIfScope(scope)
          if (scope) {
            setIsWhatIfMode(true)
          }
        }}
      />
    </div>
  )
}

// 导出的包装组件 - 提供 ReactFlow Provider
export function LogicGraphPage() {
  return (
    <ReactFlowProvider>
      <LogicGraphInner />
    </ReactFlowProvider>
  )
}