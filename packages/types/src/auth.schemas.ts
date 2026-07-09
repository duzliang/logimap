import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码')
})

export const RegisterSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().min(1, '请输入用户名').max(50, '用户名不能超过 50 个字符'),
  password: z.string().min(6, '密码至少 6 个字符').max(50, '密码不能超过 50 个字符'),
  invitationToken: z.string().optional()
})

export const UpdateUserSchema = z.object({
  name: z.string().min(1, '请输入用户名').max(50, '用户名不能超过 50 个字符').optional(),
  avatarUrl: z.string().url('请输入有效的 URL').optional().nullable(),
  emailNotifications: z.boolean().optional()
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
