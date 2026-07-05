import { z } from 'zod'

export const ConnectionTypeSchema = z.enum(['TRIGGERS', 'DEPENDS_ON', 'BLOCKS', 'EXTENDS'])
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>

export const CreateConnectionSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  type: ConnectionTypeSchema,
  label: z.string().optional(),
  description: z.string().optional()
})

export const UpdateConnectionSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  type: ConnectionTypeSchema.optional()
})

export type CreateConnectionInput = z.infer<typeof CreateConnectionSchema>
export type UpdateConnectionInput = z.infer<typeof UpdateConnectionSchema>
