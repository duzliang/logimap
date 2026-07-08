import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AnalyzeRepoSchema, ApplyImportSchema } from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { GitImportService } from '../services/git-import.service.js'

const service = new GitImportService()

export const gitImportRoutes = new Hono()
  .use('*', authMiddleware)
  .post(
    '/analyze',
    requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId),
    zValidator('json', AnalyzeRepoSchema),
    async (c) => {
      try {
        const input = c.req.valid('json')
        const result = await service.analyze(input.repoUrl, input.branch)
        return c.json({ data: result })
      } catch (error) {
        const message = error instanceof Error ? error.message : '仓库分析失败'
        return c.json({ error: message, code: 'GIT_IMPORT_ANALYZE_FAILED' }, 400)
      }
    }
  )
  .post(
    '/apply',
    requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId),
    zValidator('json', ApplyImportSchema),
    async (c) => {
      try {
        const input = c.req.valid('json')
        const result = await service.apply(input.teamId, input)
        return c.json({ data: result }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : '导入失败'
        return c.json({ error: message, code: 'GIT_IMPORT_APPLY_FAILED' }, 400)
      }
    }
  )
