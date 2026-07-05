import type {
  Branch,
  EdgeCase,
  LogicNodeStatus,
  NodePriority,
  CreateLogicNodeInput,
  UpdateLogicNodeInput,
  UpdatePositionInput
} from '@logimap/types'

export type { Branch, EdgeCase, LogicNodeStatus, NodePriority, CreateLogicNodeInput, UpdateLogicNodeInput, UpdatePositionInput }

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
  snapshot: Record<string, unknown>
  changeNote?: string | null
  createdAt: string
  nodeId: string
  createdBy?: {
    id: string
    name: string
  } | null
}
