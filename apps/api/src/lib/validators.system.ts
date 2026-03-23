import { z } from 'zod'

// System 相关验证器
export const CreateSystemSchema = z.object({
  name: z.string().min(1, '请输入系统名称').max(100, '系统名称不能超过 100 个字符'),
  slug: z.string().min(1, '请输入系统标识').regex(/^[a-z0-9-]+$/, '系统标识只能包含小写字母、数字和连字符'),
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').optional()
})

export const UpdateSystemSchema = z.object({
  name: z.string().min(1, '请输入系统名称').max(100, '系统名称不能超过 100 个字符').optional(),
  slug: z.string().min(1, '请输入系统标识').regex(/^[a-z0-9-]+$/, '系统标识只能包含小写字母、数字和连字符').optional(),
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').optional()
})

// Module 相关验证器
export const CreateModuleSchema = z.object({
  name: z.string().min(1, '请输入模块名称').max(100, '模块名称不能超过 100 个字符'),
  slug: z.string().min(1, '请输入模块标识').regex(/^[a-z0-9-]+$/, '模块标识只能包含小写字母、数字和连字符'),
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  order: z.number().int().optional().default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').optional()
})

export const UpdateModuleSchema = z.object({
  name: z.string().min(1, '请输入模块名称').max(100, '模块名称不能超过 100 个字符').optional(),
  slug: z.string().min(1, '请输入模块标识').regex(/^[a-z0-9-]+$/, '模块标识只能包含小写字母、数字和连字符').optional(),
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  order: z.number().int().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').optional()
})

export type CreateSystemInput = z.infer<typeof CreateSystemSchema>
export type UpdateSystemInput = z.infer<typeof UpdateSystemSchema>
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>
