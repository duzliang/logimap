import type {
  Branch,
  EdgeCase,
  LogicNodeStatus,
  NodePriority
} from './logic-node.schemas.js'
import type { ConnectionType } from './graph.schemas.js'

export type { Branch, EdgeCase, LogicNodeStatus, NodePriority, ConnectionType }

export interface LogicNodeData {
  id: string
  name: string
  summary?: string
  status: LogicNodeStatus
  priority: NodePriority

  // 6 个核心字段
  trigger?: string
  dependsOn?: string
  mainFlow?: string       // Tiptap JSON
  branches?: Branch[]
  edgeCases?: EdgeCase[]
  codeRef?: string

  // 元数据
  tags: string[]
  moduleId: string
  moduleName?: string    // joined
  positionX?: number
  positionY?: number
  createdAt: string
  updatedAt: string

  // React Flow 需要 data 满足 Record<string, unknown>
  [key: string]: unknown
}

// React Flow 图谱专用类型
export interface GraphNode {
  id: string
  type: 'logicNode'
  position: { x: number; y: number }
  data: LogicNodeData
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  type: 'default' | 'smoothstep'
  data: { connectionType: ConnectionType }
}

export interface GraphConnection {
  id: string
  source: string
  target: string
  label?: string
  type: ConnectionType
  description?: string
}
