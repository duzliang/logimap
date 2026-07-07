import { prisma } from '../db/prisma.js'
import type { Prisma } from '@prisma/client'
import type {
  LogicNodeStatus,
  NodePriority,
  SearchResponse,
  SearchResultItem
} from '@logimap/types'

export interface SearchOptions {
  teamId: string
  q?: string
  systemId?: string
  moduleId?: string
  type?: 'all' | 'system' | 'module' | 'node'
  statuses?: string
  priorities?: string
  tags?: string
  assigneeId?: string
  limit?: number
  offset?: number
}

function parseEnumArray<T extends string>(
  value: string | undefined,
  allowed: readonly T[]
): T[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is T => allowed.includes(v as T))
}

function parseTags(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function emptyGroup(limit: number, offset: number) {
  return { items: [], total: 0, limit, offset }
}

export class SearchService {
  async search(options: SearchOptions): Promise<SearchResponse> {
    const {
      teamId,
      q,
      systemId,
      moduleId,
      type = 'all',
      statuses,
      priorities,
      tags,
      assigneeId,
      limit = 20,
      offset = 0
    } = options

    const parsedStatuses = parseEnumArray<LogicNodeStatus>(
      statuses,
      ['DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED']
    )
    const parsedPriorities = parseEnumArray<NodePriority>(priorities, ['HIGH', 'NORMAL', 'LOW'])
    const parsedTags = parseTags(tags)

    const shouldSearchSystems = type === 'all' || type === 'system'
    const shouldSearchModules = type === 'all' || type === 'module'
    const shouldSearchNodes = type === 'all' || type === 'node'

    const [systems, modules, nodes] = await Promise.all([
      shouldSearchSystems
        ? this.searchSystems({ teamId, systemId, q, limit, offset })
        : Promise.resolve(emptyGroup(limit, offset)),
      shouldSearchModules
        ? this.searchModules({ teamId, systemId, q, limit, offset })
        : Promise.resolve(emptyGroup(limit, offset)),
      shouldSearchNodes
        ? this.searchNodes({
            teamId,
            systemId,
            moduleId,
            q,
            statuses: parsedStatuses,
            priorities: parsedPriorities,
            tags: parsedTags,
            assigneeId,
            limit,
            offset
          })
        : Promise.resolve(emptyGroup(limit, offset))
    ])

    return { systems, modules, nodes }
  }

  private async searchSystems(params: {
    teamId: string
    systemId?: string
    q?: string
    limit: number
    offset: number
  }) {
    const { teamId, systemId, q, limit, offset } = params

    const where: Prisma.SystemWhereInput = {
      teamId,
      ...(systemId && { id: systemId }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      })
    }

    const [items, total] = await Promise.all([
      prisma.system.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.system.count({ where })
    ])

    return {
      items: items.map(
        (system): SearchResultItem => ({
          type: 'system',
          id: system.id,
          title: system.name,
          subtitle: system.description,
          href: `/systems/${system.id}`,
          teamId: system.teamId
        })
      ),
      total,
      limit,
      offset
    }
  }

  private async searchModules(params: {
    teamId: string
    systemId?: string
    q?: string
    limit: number
    offset: number
  }) {
    const { teamId, systemId, q, limit, offset } = params

    const where: Prisma.ModuleWhereInput = {
      system: { teamId, ...(systemId && { id: systemId }) },
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      })
    }

    const [items, total] = await Promise.all([
      prisma.module.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
        include: { system: { select: { teamId: true } } }
      }),
      prisma.module.count({ where })
    ])

    return {
      items: items.map(
        (module): SearchResultItem => ({
          type: 'module',
          id: module.id,
          title: module.name,
          subtitle: module.description,
          href: `/modules/${module.id}`,
          teamId: module.system.teamId,
          systemId: module.systemId
        })
      ),
      total,
      limit,
      offset
    }
  }

  private async searchNodes(params: {
    teamId: string
    systemId?: string
    moduleId?: string
    q?: string
    statuses: LogicNodeStatus[]
    priorities: NodePriority[]
    tags: string[]
    assigneeId?: string
    limit: number
    offset: number
  }) {
    const {
      teamId,
      systemId,
      moduleId,
      q,
      statuses,
      priorities,
      tags,
      assigneeId,
      limit,
      offset
    } = params

    const where: Prisma.LogicNodeWhereInput = {
      module: {
        system: { teamId, ...(systemId && { id: systemId }) },
        ...(moduleId && { id: moduleId })
      },
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { codeRef: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } }
        ]
      }),
      ...(statuses.length > 0 && { status: { in: statuses } }),
      ...(priorities.length > 0 && { priority: { in: priorities } }),
      ...(tags.length > 0 && { tags: { hasEvery: tags } }),
      ...(assigneeId && { createdById: assigneeId })
    }

    const [items, total] = await Promise.all([
      prisma.logicNode.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          module: {
            select: { systemId: true, system: { select: { teamId: true } } }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.logicNode.count({ where })
    ])

    return {
      items: items.map(
        (node): SearchResultItem => ({
          type: 'node',
          id: node.id,
          title: node.name,
          subtitle: node.summary,
          href: `/modules/${node.moduleId}/nodes?highlight=${node.id}`,
          teamId: node.module.system.teamId,
          systemId: node.module.systemId,
          moduleId: node.moduleId,
          status: node.status,
          priority: node.priority,
          tags: node.tags,
          assignee: node.createdBy
        })
      ),
      total,
      limit,
      offset
    }
  }
}
