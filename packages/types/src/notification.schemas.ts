import { z } from 'zod'

export const NotificationTypeSchema = z.enum([
  'NODE_STATUS_CHANGED',
  'NODE_REVIEW_REQUESTED',
  'NODE_REVIEW_APPROVED',
  'NODE_REVIEW_REJECTED',
  'NODE_DEPRECATED',
  'MENTIONED_IN_NODE',
  'TEAM_INVITATION_RECEIVED',
  'TEAM_INVITATION_ACCEPTED',
  'TEAM_ROLE_CHANGED',
  'SYSTEM_BROADCAST'
])

export type NotificationType = z.infer<typeof NotificationTypeSchema>

export const NotificationActorSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string()
})

export const NotificationPayloadSchema = z.object({
  nodeName: z.string().optional(),
  teamName: z.string().optional(),
  moduleName: z.string().optional(),
  systemName: z.string().optional(),
  actorName: z.string().optional(),
  fromStatus: z.string().optional(),
  toStatus: z.string().optional(),
  role: z.string().optional()
})

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  payload: NotificationPayloadSchema.nullable(),
  isRead: z.boolean(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  actor: NotificationActorSchema.nullable(),
  teamId: z.string().nullable(),
  nodeId: z.string().nullable(),
  moduleId: z.string().nullable()
})

export const CreateNotificationSchema = z.object({
  type: NotificationTypeSchema,
  userId: z.string(),
  actorId: z.string().optional(),
  teamId: z.string().optional(),
  nodeId: z.string().optional(),
  moduleId: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  payload: NotificationPayloadSchema.optional()
})

export const MarkReadSchema = z
  .object({
    ids: z.array(z.string()).optional(),
    all: z.boolean().optional()
  })
  .refine((data) => data.ids !== undefined || data.all === true, {
    message: '请提供通知 ID 列表或标记全部已读'
  })

export const NotificationListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeRead: z.enum(['true', 'false']).default('true')
})

export type Notification = z.infer<typeof NotificationSchema>
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>
export type MarkReadInput = z.infer<typeof MarkReadSchema>
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>
