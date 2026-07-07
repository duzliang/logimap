import { prisma } from '../db/prisma.js'
import type { Context, MiddlewareHandler } from 'hono'
import type { TeamRole } from '@logimap/types'

export const roleRank: Record<TeamRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4
}

export function hasRole(role: TeamRole, minRole: TeamRole): boolean {
  return roleRank[role] >= roleRank[minRole]
}

export async function getMembership(userId: string, teamId: string) {
  return prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  })
}

export type TeamIdResolver = (c: Context) => Promise<{ teamId: string } | null>

export function requireTeamRole(
  minRole: TeamRole,
  resolveTeamId: TeamIdResolver
): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '未授权访问', code: 'UNAUTHORIZED' }, 401)
    }

    const resolved = await resolveTeamId(c)
    if (!resolved) {
      return c.json({ error: '资源不存在', code: 'NOT_FOUND' }, 404)
    }

    const membership = await getMembership(user.userId, resolved.teamId)
    if (!membership || !hasRole(membership.role, minRole)) {
      return c.json({ error: '权限不足', code: 'FORBIDDEN' }, 403)
    }

    c.set('teamId', resolved.teamId)
    c.set('role', membership.role)
    await next()
  }
}

export const teamResolvers = {
  fromQuery:
    (paramName: string): TeamIdResolver =>
    async (c) => {
      const teamId = c.req.query(paramName)
      return teamId ? { teamId } : null
    },

  fromQueryOrDefault:
    (paramName: string): TeamIdResolver =>
    async (c) => {
      const user = c.get('user')
      const teamId = c.req.query(paramName)
      if (teamId) {
        return { teamId }
      }

      const memberships = await prisma.teamMember.findMany({
        where: { userId: user.userId },
        orderBy: { joinedAt: 'asc' },
        take: 1
      })

      if (memberships.length === 0) {
        return null
      }

      return { teamId: memberships[0].teamId }
    },

  fromSystemParam: async (c: Context) => {
    const systemId = c.req.param('systemId')
    if (!systemId) return null

    const system = await prisma.system.findUnique({
      where: { id: systemId },
      select: { teamId: true }
    })

    return system ? { teamId: system.teamId } : null
  },

  fromModuleParam: async (c: Context) => {
    const moduleId = c.req.param('moduleId')
    if (!moduleId) return null

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        system: {
          select: { teamId: true }
        }
      }
    })

    return module ? { teamId: module.system.teamId } : null
  },

  fromNodeParam: async (c: Context) => {
    const nodeId = c.req.param('nodeId')
    if (!nodeId) return null

    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      select: {
        module: {
          select: {
            system: {
              select: { teamId: true }
            }
          }
        }
      }
    })

    return node ? { teamId: node.module.system.teamId } : null
  },

  fromConnectionParam: async (c: Context) => {
    const connId = c.req.param('connId')
    if (!connId) return null

    const connection = await prisma.connection.findUnique({
      where: { id: connId },
      select: {
        source: {
          select: {
            module: {
              select: {
                system: {
                  select: { teamId: true }
                }
              }
            }
          }
        }
      }
    })

    return connection ? { teamId: connection.source.module.system.teamId } : null
  },

  fromTeamParam: async (c: Context) => {
    const teamId = c.req.param('teamId')
    return teamId ? { teamId } : null
  },

  fromNodeBody: async (c: Context) => {
    const body = (await c.req.json<{ nodeId?: string }>().catch(() => ({ nodeId: undefined }))) ?? { nodeId: undefined }
    const nodeId = body.nodeId
    if (!nodeId) return null

    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      select: {
        module: {
          select: {
            system: {
              select: { teamId: true }
            }
          }
        }
      }
    })

    return node ? { teamId: node.module.system.teamId } : null
  },

  fromModuleQuery: async (c: Context) => {
    const moduleId = c.req.query('moduleId')
    if (!moduleId) return null

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        system: {
          select: { teamId: true }
        }
      }
    })

    return module ? { teamId: module.system.teamId } : null
  },

  fromReportParam: async (c: Context) => {
    const reportId = c.req.param('reportId')
    if (!reportId) return null

    const report = await prisma.impactAnalysisReport.findUnique({
      where: { id: reportId },
      select: {
        moduleId: true
      }
    })

    if (!report) return null

    const module = await prisma.module.findUnique({
      where: { id: report.moduleId },
      select: {
        system: {
          select: { teamId: true }
        }
      }
    })

    return module ? { teamId: module.system.teamId } : null
  },

  fromBodyTeamId: async (c: Context) => {
    const body = (await c.req.json<{ teamId?: string }>().catch(() => ({ teamId: undefined }))) ?? { teamId: undefined }
    const teamId = body.teamId
    return teamId ? { teamId } : null
  }
}
