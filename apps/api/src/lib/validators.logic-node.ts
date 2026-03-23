import { z } from 'zod'

// LogicNode 相关验证器
export const CreateLogicNodeSchema = z.object({
  name: z.string().min(1, '请输入节点名称').max(200, '节点名称不能超过 200 个字符'),
  summary: z.string().max(500, '概述不能超过 500 个字符').optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED']).optional().default('DRAFT'),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).optional().default('NORMAL'),
  trigger: z.string().optional(),
  dependsOn: z.string().optional(),
  mainFlow: z.string().optional(),
  branches: z.array(z.object({
    id: z.string(),
    condition: z.string(),
    action: z.string(),
    resultStatus: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  edgeCases: z.array(z.object({
    id: z.string(),
    scenario: z.string(),
    handling: z.string(),
    severity: z.enum(['critical', 'warning', 'info'])
  })).optional(),
  codeRef: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0)
})

export const UpdateLogicNodeSchema = z.object({
  name: z.string().min(1, '请输入节点名称').max(200, '节点名称不能超过 200 个字符').optional(),
  summary: z.string().max(500, '概述不能超过 500 个字符').optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED']).optional(),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).optional(),
  trigger: z.string().optional(),
  dependsOn: z.string().optional(),
  mainFlow: z.string().optional(),
  branches: z.array(z.object({
    id: z.string(),
    condition: z.string(),
    action: z.string(),
    resultStatus: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  edgeCases: z.array(z.object({
    id: z.string(),
    scenario: z.string(),
    handling: z.string(),
    severity: z.enum(['critical', 'warning', 'info'])
  })).optional(),
  codeRef: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional()
})

export const UpdatePositionSchema = z.object({
  positionX: z.number(),
  positionY: z.number()
})

export type CreateLogicNodeInput = z.infer<typeof CreateLogicNodeSchema>
export type UpdateLogicNodeInput = z.infer<typeof UpdateLogicNodeSchema>
export type UpdatePositionInput = z.infer<typeof UpdatePositionSchema>
