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
  type Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { toPng } from 'html-to-image'
import dagre from '@dagrejs/dagre'
import { fetchGraphData, updateNodePosition, createConnection } from '@/api/graph.api'
import { fetchModule } from '@/api/systems.api'
import { updateConnection, deleteConnection, type ConnectionType } from '@/api/connection.api'
import { LogicNodeComponent } from './LogicNode'
import { LogicEdge } from './LogicEdge'
import { GraphToolbar } from './GraphToolbar'
import { EdgeEditDialog } from './EdgeEditDialog'
import { NodeDetailDialog } from './NodeDetailDialog'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const nodeTypes = {
  logicNode: LogicNodeComponent
}

const edgeTypes = {
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
  branches?: any[]
  edgeCases?: any[]
  status: string
  priority: string
}

// Dagre 布局配置
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 220
const nodeHeight = 150

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
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
  const queryClient = useQueryClient()
  const { fitView } = useReactFlow()
  const flowRef = useRef<HTMLDivElement>(null)

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

  // 更新节点位置 mutation
  const updatePositionMutation = useMutation({
    mutationFn: ({ nodeId, x, y }: { nodeId: string; x: number; y: number }) =>
      updateNodePosition(nodeId, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', moduleId] })
    }
  })

  // 创建连线 mutation
  const createConnectionMutation = useMutation({
    mutationFn: (data: any) => createConnection(data.source, data.target, data.type || 'TRIGGERS'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', moduleId] })
      toast.success('连线创建成功')
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
    onError: (error: any) => {
      toast.error(error.message || '删除连线失败')
    }
  })

  // 转换图谱数据为 React Flow 格式
  useEffect(() => {
    if (graphData) {
      const flowNodes: Node[] = graphData.nodes.map((node: any) => ({
        id: node.id,
        type: 'logicNode',
        position: { x: node.positionX || 0, y: node.positionY || 0 },
        data: node
      }))

      const flowEdges: Edge[] = graphData.connections.map((conn: any) => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        type: 'default',
        data: {
          connectionType: conn.type,
          label: conn.label || undefined
        }
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [graphData])

  // 处理节点拖拽结束
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
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
    (_: any, edge: Edge) => {
      const conn = graphData?.connections.find((c: any) => c.id === edge.id)
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
    (_: any, node: Node) => {
      setSelectedNode(node.data as unknown as NodeDetailData)
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
        backgroundColor: '#f9fafb',
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold">加载图谱数据...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gray-50">
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
          nodeTypes={nodeTypes as any}
          edgeTypes={edgeTypes as any}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          minZoom={0.25}
          maxZoom={2}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls className="bg-white border rounded-lg shadow-sm" />
          <MiniMap
            className="bg-white border rounded-lg shadow-sm"
            nodeColor={(node) => {
              const status = node.data?.status
              if (status === 'APPROVED') return '#22c55e'
              if (status === 'REVIEW') return '#eab308'
              if (status === 'DEPRECATED') return '#ef4444'
              return '#6b7280'
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
        onEdit={() => {
          setIsNodeDialogOpen(false)
          navigate(`/modules/${moduleId}/nodes?edit=${selectedNode?.id}`)
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