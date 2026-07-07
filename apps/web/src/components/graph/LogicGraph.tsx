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
import { toPng } from 'html-to-image'
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
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@logimap/ui'
import { useAuthStore } from '@/stores/auth.store'

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
      const highlightSet = new Set(matchedNodeIds)
      const hasHighlight = highlightSet.size > 0

      const flowNodes: Node[] = graphData.nodes.map((node) => ({
        id: node.id,
        type: 'logicNode',
        position: { x: node.positionX || 0, y: node.positionY || 0 },
        data: {
          ...node,
          highlighted: hasHighlight && highlightSet.has(node.id),
          dimmed: hasHighlight && !highlightSet.has(node.id)
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
  }, [graphData, matchedNodeIds])

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

  // 导出图片
  const handleExportImage = useCallback(async () => {
    if (!flowRef.current) return

    try {
      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: 'var(--color-bg-base)',
        quality: 1.0
      })

      const link = document.createElement('a')
      link.download = `logimap-${module?.name || 'graph'}-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()

      toast.success('图片导出成功')
    } catch (error) {
      toast.error('导出图片失败')
    }
  }, [module?.name])

  const handleToggleListView = () => {
    navigate(`/modules/${moduleId}/nodes`)
  }

  const handleFitView = () => {
    fitView({ padding: 0.2 })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
        <div className="text-center">
          <h1 className="text-xl font-semibold">加载图谱数据...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-[var(--color-bg-base)]">
      <GraphToolbar
        onCreateNode={handleCreateNode}
        onAutoLayout={handleAutoLayout}
        onFitView={handleFitView}
        onExportImage={handleExportImage}
        onToggleListView={handleToggleListView}
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