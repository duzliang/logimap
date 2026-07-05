import { z } from 'zod'

export const LogicNodeStatusSchema = z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED'])
export const NodePrioritySchema = z.enum(['HIGH', 'NORMAL', 'LOW'])
export const EdgeCaseSeveritySchema = z.enum(['critical', 'warning', 'info'])
export const ApprovalActionSchema = z.enum(['SUBMIT', 'APPROVE', 'REJECT', 'DEPRECATE', 'REVOKE'])

export type LogicNodeStatus = z.infer<typeof LogicNodeStatusSchema>
export type NodePriority = z.infer<typeof NodePrioritySchema>
export type EdgeCaseSeverity = z.infer<typeof EdgeCaseSeveritySchema>
export type ApprovalAction = z.infer<typeof ApprovalActionSchema>

export const BranchSchema = z.object({
  id: z.string(),
  condition: z.string(),
  action: z.string(),
  resultStatus: z.string().optional(),
  notes: z.string().optional()
})

export const EdgeCaseSchema = z.object({
  id: z.string(),
  scenario: z.string(),
  handling: z.string(),
  severity: EdgeCaseSeveritySchema
})

export type Branch = z.infer<typeof BranchSchema>
export type EdgeCase = z.infer<typeof EdgeCaseSchema>

export const CreateLogicNodeSchema = z.object({
  name: z.string().min(1, '请输入节点名称').max(200, '节点名称不能超过 200 个字符'),
  summary: z.string().max(500, '概述不能超过 500 个字符').optional(),
  status: LogicNodeStatusSchema.optional().default('DRAFT'),
  priority: NodePrioritySchema.optional().default('NORMAL'),
  trigger: z.string().optional(),
  dependsOn: z.string().optional(),
  mainFlow: z.string().optional(),
  branches: z.array(BranchSchema).optional(),
  edgeCases: z.array(EdgeCaseSchema).optional(),
  codeRef: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0)
})

export const UpdateLogicNodeSchema = CreateLogicNodeSchema.partial().omit({ tags: true }).extend({
  tags: z.array(z.string()).optional()
})

export const UpdatePositionSchema = z.object({
  positionX: z.number(),
  positionY: z.number()
})

export const NodeApprovalSchema = z.object({
  action: ApprovalActionSchema,
  comment: z.string().max(500, '备注不能超过 500 个字符').optional()
})

export const CompareVersionsSchema = z.object({
  compareTo: z.coerce.number().int().positive().optional()
})

export type CreateLogicNodeInput = z.infer<typeof CreateLogicNodeSchema>
export type UpdateLogicNodeInput = z.infer<typeof UpdateLogicNodeSchema>
export type UpdatePositionInput = z.infer<typeof UpdatePositionSchema>
export type NodeApprovalInput = z.infer<typeof NodeApprovalSchema>
export type CompareVersionsInput = z.infer<typeof CompareVersionsSchema>
