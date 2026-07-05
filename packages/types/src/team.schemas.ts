import { z } from 'zod'

export const TeamRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
export type TeamRole = z.infer<typeof TeamRoleSchema>

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED'])
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>

export const CreateTeamSchema = z.object({
  name: z.string().min(1, '请输入团队名称').max(100, '团队名称不能超过 100 个字符'),
  slug: z
    .string()
    .min(1, '请输入团队标识')
    .regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和连字符'),
  description: z.string().max(500, '描述不能超过 500 个字符').optional()
})

export const UpdateTeamSchema = CreateTeamSchema.partial()

export const InviteMemberSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  role: TeamRoleSchema.default('MEMBER')
})

export const UpdateMemberRoleSchema = z.object({
  role: TeamRoleSchema
})

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, '邀请链接无效')
})

export const RegisterWithInvitationSchema = z.object({
  token: z.string().optional()
})

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>
