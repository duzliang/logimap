import { prisma } from '../db/prisma.js'
import { SearchService } from '../services/search.service.js'
import { CodeLinksService } from '../services/code-links.service.js'

/**
 * MCP 只读工具（T3-19）
 *
 * 供 Cursor / Claude Code 等通过 MCP 查询逻辑图谱。
 * 所有查询按会话用户所属团队授权，避免越权访问。
 */

export interface McpSession {
  userId: string
  email: string
  /** 用户所属团队 ID 列表，用于授权 */
  teamIds: string[]
}

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const mcpTools: McpToolDefinition[] = [
  {
    name: 'list_teams',
    description: '列出当前 API 令牌所属用户可访问的团队',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'list_systems',
    description: '列出某团队下的业务系统',
    inputSchema: {
      type: 'object',
      properties: { teamId: { type: 'string', description: '团队 ID' } },
      required: ['teamId']
    }
  },
  {
    name: 'list_modules',
    description: '列出某系统下的模块',
    inputSchema: {
      type: 'object',
      properties: { systemId: { type: 'string', description: '系统 ID' } },
      required: ['systemId']
    }
  },
  {
    name: 'list_nodes',
    description: '列出某模块下的逻辑节点（含状态、概述、代码关联）',
    inputSchema: {
      type: 'object',
      properties: { moduleId: { type: 'string', description: '模块 ID' } },
      required: ['moduleId']
    }
  },
  {
    name: 'search_nodes',
    description: '在某团队范围内按关键词搜索逻辑节点',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'string', description: '团队 ID' },
        query: { type: 'string', description: '搜索关键词' }
      },
      required: ['teamId', 'query']
    }
  },
  {
    name: 'get_node',
    description: '获取单个逻辑节点的完整详情（六大字段、代码关联等）',
    inputSchema: {
      type: 'object',
      properties: { nodeId: { type: 'string', description: '节点 ID' } },
      required: ['nodeId']
    }
  },
  {
    name: 'find_nodes_by_code',
    description: '代码反向关联：给定代码文件路径（及可选行号），反查引用它的逻辑节点',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'string', description: '团队 ID' },
        path: { type: 'string', description: '文件路径（仓库相对或绝对均可）' },
        line: { type: 'number', description: '可选行号，用于按节点行号区间过滤' }
      },
      required: ['teamId', 'path']
    }
  }
]

export class McpToolError extends Error {}

const searchService = new SearchService()
const codeLinksService = new CodeLinksService()

function assertTeamAccess(session: McpSession, teamId: string) {
  if (!session.teamIds.includes(teamId)) {
    throw new McpToolError('无权访问该团队')
  }
}

async function teamIdForSystem(systemId: string): Promise<string> {
  const system = await prisma.system.findUnique({ where: { id: systemId }, select: { teamId: true } })
  if (!system) throw new McpToolError('系统不存在')
  return system.teamId
}

async function teamIdForModule(moduleId: string): Promise<string> {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { system: { select: { teamId: true } } }
  })
  if (!module) throw new McpToolError('模块不存在')
  return module.system.teamId
}

async function teamIdForNode(nodeId: string): Promise<string> {
  const node = await prisma.logicNode.findUnique({
    where: { id: nodeId },
    select: { module: { select: { system: { select: { teamId: true } } } } }
  })
  if (!node) throw new McpToolError('节点不存在')
  return node.module.system.teamId
}

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new McpToolError(`缺少参数：${key}`)
  }
  return value
}

/** 执行工具，返回可序列化结果对象 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  session: McpSession
): Promise<unknown> {
  switch (name) {
    case 'list_teams': {
      const teams = await prisma.team.findMany({
        where: { id: { in: session.teamIds } },
        select: { id: true, name: true, slug: true }
      })
      return { teams }
    }
    case 'list_systems': {
      const teamId = requireString(args, 'teamId')
      assertTeamAccess(session, teamId)
      const systems = await prisma.system.findMany({
        where: { teamId },
        select: { id: true, name: true, slug: true, description: true, repoUrl: true },
        orderBy: { createdAt: 'asc' }
      })
      return { systems }
    }
    case 'list_modules': {
      const systemId = requireString(args, 'systemId')
      assertTeamAccess(session, await teamIdForSystem(systemId))
      const modules = await prisma.module.findMany({
        where: { systemId },
        select: { id: true, name: true, slug: true, description: true },
        orderBy: { order: 'asc' }
      })
      return { modules }
    }
    case 'list_nodes': {
      const moduleId = requireString(args, 'moduleId')
      assertTeamAccess(session, await teamIdForModule(moduleId))
      const nodes = await prisma.logicNode.findMany({
        where: { moduleId },
        select: { id: true, name: true, summary: true, status: true, priority: true, codeRef: true, tags: true },
        orderBy: { createdAt: 'asc' }
      })
      return { nodes }
    }
    case 'search_nodes': {
      const teamId = requireString(args, 'teamId')
      const query = requireString(args, 'query')
      assertTeamAccess(session, teamId)
      const result = await searchService.search({ teamId, q: query, type: 'node', limit: 20 })
      return { nodes: result.nodes?.items ?? [] }
    }
    case 'get_node': {
      const nodeId = requireString(args, 'nodeId')
      assertTeamAccess(session, await teamIdForNode(nodeId))
      const node = await prisma.logicNode.findUnique({
        where: { id: nodeId },
        select: {
          id: true,
          name: true,
          summary: true,
          status: true,
          priority: true,
          trigger: true,
          dependsOn: true,
          mainFlow: true,
          branches: true,
          edgeCases: true,
          codeRef: true,
          tags: true,
          moduleId: true
        }
      })
      if (!node) throw new McpToolError('节点不存在')
      return { node }
    }
    case 'find_nodes_by_code': {
      const teamId = requireString(args, 'teamId')
      const path = requireString(args, 'path')
      assertTeamAccess(session, teamId)
      const line = typeof args.line === 'number' ? args.line : undefined
      const result = await codeLinksService.findNodesByPath({ teamId, path, line })
      return result
    }
    default:
      throw new McpToolError(`未知工具：${name}`)
  }
}
