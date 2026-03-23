// Logic Node 核心类型
export interface Branch {
  id: string
  condition: string      // 条件描述，如「如果客户已付款」
  action: string         // 结果动作，如「触发发票生成」
  resultStatus?: string  // 结果状态
  notes?: string
}

export interface EdgeCase {
  id: string
  scenario: string       // 场景描述，如「配件库存为 0 时」
  handling: string       // 处理方式
  severity: 'critical' | 'warning' | 'info'
}

export type LogicNodeStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'DEPRECATED'
export type NodePriority = 'HIGH' | 'NORMAL' | 'LOW'

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
  data: { connectionType: string }
}

// 连线类型
export type ConnectionType = 'TRIGGERS' | 'DEPENDS_ON' | 'BLOCKS' | 'EXTENDS'

export interface GraphConnection {
  id: string
  source: string
  target: string
  label?: string
  type: ConnectionType
  description?: string
}
