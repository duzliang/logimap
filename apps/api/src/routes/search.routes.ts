import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { SearchService } from '../services/search.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { SearchQuerySchema } from '../lib/validators.search.js'

const search = new SearchService()

export const searchRoutes = new Hono()
  .use('*', authMiddleware)
  .get(
    '/',
    requireTeamRole('VIEWER', teamResolvers.fromQueryOrDefault('teamId')),
    zValidator('query', SearchQuerySchema),
    async (c) => {
      try {
        const teamId = c.get('teamId')
        const query = c.req.valid('query')

        const result = await search.search({
          teamId,
          q: query.q,
          systemId: query.systemId,
          moduleId: query.moduleId,
          type: query.type,
          statuses: query.statuses,
          priorities: query.priorities,
          tags: query.tags,
          assigneeId: query.assigneeId,
          limit: query.limit,
          offset: query.offset
        })

        return c.json({ data: result })
      } catch (error) {
        const message = error instanceof Error ? error.message : '搜索失败'
        return c.json({ error: message, code: 'SEARCH_FAILED' }, 500)
      }
    }
  )
