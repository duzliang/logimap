import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../db/prisma.js'
import { createUser, createTeam, addTeamMember, createSystem, createModule, createLogicNode } from '../test/factories.js'
import { handleRpc } from './dispatch.js'
import type { McpSession } from './tools.js'

let session: McpSession
let outsiderSession: McpSession
const ids = { userIds: [] as string[], teamIds: [] as string[] }
let systemId: string
let moduleId: string
let nodeId: string
let foreignTeamId: string

beforeAll(async () => {
  const user = await createUser()
  const team = await createTeam()
  await addTeamMember(user.id, team.id, 'OWNER')
  ids.userIds.push(user.id)
  ids.teamIds.push(team.id)

  const system = await createSystem(team.id, { name: 'MCP Sys' })
  const module = await createModule(system.id, { name: 'MCP Mod' })
  const node = await createLogicNode(module.id, user.id, { name: 'MCP Node Alpha', summary: 'mcp searchable' })
  systemId = system.id
  moduleId = module.id
  nodeId = node.id

  const outsider = await createUser()
  const foreignTeam = await createTeam()
  await addTeamMember(outsider.id, foreignTeam.id, 'OWNER')
  ids.userIds.push(outsider.id)
  ids.teamIds.push(foreignTeam.id)
  foreignTeamId = foreignTeam.id

  session = { userId: user.id, email: user.email, teamIds: [team.id] }
  outsiderSession = { userId: outsider.id, email: outsider.email, teamIds: [foreignTeam.id] }
})

afterAll(async () => {
  await prisma.logicNode.deleteMany({ where: { moduleId } })
  await prisma.module.deleteMany({ where: { id: moduleId } })
  await prisma.system.deleteMany({ where: { id: systemId } })
  await prisma.teamMember.deleteMany({ where: { teamId: { in: ids.teamIds } } })
  await prisma.team.deleteMany({ where: { id: { in: ids.teamIds } } })
  await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } })
})

describe('MCP handleRpc', () => {
  it('initialize 返回协议版本与能力', async () => {
    const res = await handleRpc({ jsonrpc: '2.0', id: 1, method: 'initialize' }, session)
    expect(res?.result).toMatchObject({
      protocolVersion: expect.any(String),
      serverInfo: { name: 'logimap-mcp' }
    })
  })

  it('通知（initialized）不返回响应', async () => {
    const res = await handleRpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, session)
    expect(res).toBeNull()
  })

  it('tools/list 返回工具集合', async () => {
    const res = await handleRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, session)
    const tools = (res?.result as { tools: Array<{ name: string }> }).tools
    expect(tools.map((t) => t.name)).toContain('search_nodes')
    expect(tools.map((t) => t.name)).toContain('get_node')
  })

  it('tools/call list_systems 返回团队系统', async () => {
    const res = await handleRpc(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_systems', arguments: { teamId: session.teamIds[0] } } },
      session
    )
    const text = (res?.result as { content: Array<{ text: string }> }).content[0].text
    expect(text).toContain('MCP Sys')
    expect(text).toContain(systemId)
  })

  it('tools/call search_nodes 命中节点', async () => {
    const res = await handleRpc(
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'search_nodes', arguments: { teamId: session.teamIds[0], query: 'Alpha' } } },
      session
    )
    const text = (res?.result as { content: Array<{ text: string }> }).content[0].text
    expect(text).toContain('MCP Node Alpha')
  })

  it('tools/call get_node 返回完整详情', async () => {
    const res = await handleRpc(
      { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_node', arguments: { nodeId } } },
      session
    )
    const text = (res?.result as { content: Array<{ text: string }> }).content[0].text
    expect(text).toContain('MCP Node Alpha')
    expect(text).toContain(moduleId)
  })

  it('越权访问其他团队系统返回 isError', async () => {
    const res = await handleRpc(
      { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'list_systems', arguments: { teamId: session.teamIds[0] } } },
      outsiderSession
    )
    expect((res?.result as { isError?: boolean }).isError).toBe(true)
  })

  it('未知方法返回 -32601', async () => {
    const res = await handleRpc({ jsonrpc: '2.0', id: 7, method: 'no/such' }, session)
    expect(res?.error?.code).toBe(-32601)
  })

  it('outsider 访问自己空团队时无系统', async () => {
    const res = await handleRpc(
      { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'list_systems', arguments: { teamId: foreignTeamId } } },
      outsiderSession
    )
    const text = (res?.result as { content: Array<{ text: string }> }).content[0].text
    expect(text).toContain('"systems"')
  })
})
