import { z } from 'zod'

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').optional()
const slugSchema = z
  .string()
  .min(1, '请输入标识')
  .regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和连字符')

const repoUrlSchema = z
  .string()
  .url('仓库地址格式不正确')
  .max(500, '仓库地址过长')
  .optional()
  .or(z.literal(''))

const repoBranchSchema = z
  .string()
  .max(200, '分支名过长')
  .optional()
  .or(z.literal(''))

export const CreateSystemSchema = z.object({
  name: z.string().min(1, '请输入系统名称').max(100, '系统名称不能超过 100 个字符'),
  slug: slugSchema,
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  icon: z.string().optional(),
  color: colorSchema,
  repoUrl: repoUrlSchema,
  repoBranch: repoBranchSchema
})

export const UpdateSystemSchema = CreateSystemSchema.partial()

export const CreateModuleSchema = z.object({
  name: z.string().min(1, '请输入模块名称').max(100, '模块名称不能超过 100 个字符'),
  slug: slugSchema,
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  order: z.number().int().optional().default(0),
  color: colorSchema
})

export const UpdateModuleSchema = CreateModuleSchema.partial().extend({
  order: z.number().int().optional()
})

export type CreateSystemInput = z.infer<typeof CreateSystemSchema>
export type UpdateSystemInput = z.infer<typeof UpdateSystemSchema>
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>
