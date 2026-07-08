import { z } from 'zod'

/**
 * Git 仓库导入（T3-8）
 *
 * 输入公开仓库地址，自动分析目录结构，建议系统/模块结构，
 * 用户可编辑后导入。
 */

export const AnalyzeRepoSchema = z.object({
  teamId: z.string().min(1),
  repoUrl: z.string().trim().url('仓库地址格式不正确'),
  branch: z.string().trim().max(100).optional()
})

const suggestedModuleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  path: z.string()
})

const suggestedSystemSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  path: z.string(),
  modules: z.array(suggestedModuleSchema)
})

export const ApplyImportSchema = z.object({
  teamId: z.string().min(1),
  repoUrl: z.string().trim().url('仓库地址格式不正确'),
  branch: z.string().trim().max(100).optional(),
  systems: z.array(suggestedSystemSchema).min(1, '至少选择一个系统')
})

export type AnalyzeRepoInput = z.infer<typeof AnalyzeRepoSchema>
export type ApplyImportInput = z.infer<typeof ApplyImportSchema>
export type SuggestedModule = z.infer<typeof suggestedModuleSchema>
export type SuggestedSystem = z.infer<typeof suggestedSystemSchema>

export interface AnalyzeRepoResult {
  provider: 'github' | 'gitlab'
  owner: string
  repo: string
  branch: string
  fileCount: number
  systems: SuggestedSystem[]
}
