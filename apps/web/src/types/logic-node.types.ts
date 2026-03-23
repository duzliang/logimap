// 定义 Branch 和 EdgeCase 类型（本地定义，不依赖外部包）
export interface Branch {
  id: string
  condition: string
  action: string
  resultStatus?: string
  notes?: string
}

export interface EdgeCase {
  id: string
  scenario: string
  handling: string
  severity: 'critical' | 'warning' | 'info'
}

export type LogicNodeStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'DEPRECATED'
export type NodePriority = 'HIGH' | 'NORMAL' | 'LOW'

export interface LogicNode {
  id: string
  name: string
  summary?: string | null
  status: LogicNodeStatus
  priority: NodePriority
  trigger?: string | null
  dependsOn?: string | null
  mainFlow?: string | null
  branches?: Branch[] | null
  edgeCases?: EdgeCase[] | null
  codeRef?: string | null
  tags: string[]
  notes?: string | null
  positionX: number
  positionY: number
  moduleId: string
  createdAt: string
  updatedAt: string
  module?: {
    id: string
    name: string
    system?: {
      id: string
      name: string
    }
  }
}

export interface LogicNodeVersion {
  id: string
  version: number
  snapshot: any
  changeNote?: string | null
  createdAt: string
  nodeId: string
}

export interface CreateLogicNodeInput {
  name: string
  summary?: string
  status?: LogicNodeStatus
  priority?: NodePriority
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches?: Branch[]
  edgeCases?: EdgeCase[]
  codeRef?: string
  tags?: string[]
  notes?: string
  positionX?: number
  positionY?: number
}

export interface UpdateLogicNodeInput {
  name?: string
  summary?: string
  status?: LogicNodeStatus
  priority?: NodePriority
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches?: Branch[]
  edgeCases?: EdgeCase[]
  codeRef?: string
  tags?: string[]
  notes?: string
  positionX?: number
  positionY?: number
}

export interface UpdatePositionInput {
  positionX: number
  positionY: number
}
