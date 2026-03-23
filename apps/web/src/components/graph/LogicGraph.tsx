import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
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
import { fetchGraphData, updateNodePosition, createConnection } from '@/api/graph.api'
import { fetchModule } from '@/api/systems.api'
import { LogicNodeComponent } from './LogicNode'
import { LogicEdge } from './LogicEdge'
import { GraphToolbar } from './GraphToolbar'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const nodeTypes = {
  logicNode: LogicNodeComponent
}

const edgeTypes = {
  default: LogicEdge
}

export function LogicGraphPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { fitView } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

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

  const handleCreateNode = () => {
    navigate(`/modules/${moduleId}/nodes`)
  }

  const handleAutoLayout = () => {
    toast.info('自动布局功能待实现')
  }

  const handleExportImage = () => {
    toast.info('导出图片功能待实现')
  }

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

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
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
  )
}
