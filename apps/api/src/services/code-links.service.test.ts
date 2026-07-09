import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../db/prisma.js'
import {
  createUser,
  createTeam,
  addTeamMember,
  createSystem,
  createModule,
  createLogicNode
} from '../test/factories.js'
import { CodeLinksService } from './code-links.service.js'

const service = new CodeLinksService()

const ids = { userIds: [] as string[], teamIds: [] as string[], moduleIds: [] as string[], systemIds: [] as string[] }
let teamId: string
let otherTeamId: string

beforeAll(async () => {
  const user = await createUser()
  const team = await createTeam()
  await addTeamMember(user.id, team.id, 'OWNER')
  teamId = team.id
  ids.userIds.push(user.id)
  ids.teamIds.push(team.id)

  const system = await createSystem(team.id, { name: 'CL Sys' })
  const mod = await createModule(system.id, { name: 'CL Mod' })
  ids.systemIds.push(system.id)
  ids.moduleIds.push(mod.id)

  await createLogicNode(mod.id, user.id, { name: 'Settle Node', codeRef: 'src/services/settlement.ts#calculateSettlement' })
  await createLogicNode(mod.id, user.id, { name: 'Line Node', codeRef: 'src/services/settlement.ts#L100-L120' })
  await createLogicNode(mod.id, user.id, { name: 'Other Node', codeRef: 'src/services/order.ts' })
  await createLogicNode(mod.id, user.id, { name: 'Bare Node', codeRef: 'someFunction' })

  // 另一团队的同路径节点，验证隔离
  const otherUser = await createUser()
  const otherTeam = await createTeam()
  await addTeamMember(otherUser.id, otherTeam.id, 'OWNER')
  otherTeamId = otherTeam.id
  ids.userIds.push(otherUser.id)
  ids.teamIds.push(otherTeam.id)
  const otherSystem = await createSystem(otherTeam.id, { name: 'CL Sys2' })
  const otherMod = await createModule(otherSystem.id, { name: 'CL Mod2' })
  ids.systemIds.push(otherSystem.id)
  ids.moduleIds.push(otherMod.id)
  await createLogicNode(otherMod.id, otherUser.id, { name: 'Foreign', codeRef: 'src/services/settlement.ts' })
})

afterAll(async () => {
  await prisma.logicNode.deleteMany({ where: { moduleId: { in: ids.moduleIds } } })
  await prisma.module.deleteMany({ where: { id: { in: ids.moduleIds } } })
  await prisma.system.deleteMany({ where: { id: { in: ids.systemIds } } })
  await prisma.teamMember.deleteMany({ where: { teamId: { in: ids.teamIds } } })
  await prisma.team.deleteMany({ where: { id: { in: ids.teamIds } } })
  await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } })
})

describe('CodeLinksService.findNodesByPath', () => {
  it('按文件路径命中所有引用节点（不含裸符号/他文件）', async () => {
    const result = await service.findNodesByPath({ teamId, path: 'src/services/settlement.ts' })
    const names = result.nodes.map((n) => n.nodeName).sort()
    expect(names).toEqual(['Line Node', 'Settle Node'])
    expect(result.count).toBe(2)
  })

  it('用绝对路径尾段也能命中', async () => {
    const result = await service.findNodesByPath({ teamId, path: '/repo/src/services/settlement.ts' })
    expect(result.count).toBe(2)
  })

  it('带行号时按区间过滤', async () => {
    const inRange = await service.findNodesByPath({ teamId, path: 'src/services/settlement.ts', line: 110 })
    // Settle Node 无行号（整文件覆盖）+ Line Node 命中区间 → 2 个
    expect(inRange.count).toBe(2)
    expect(inRange.nodes.find((n) => n.nodeName === 'Line Node')?.lineMatched).toBe(true)

    const outRange = await service.findNodesByPath({ teamId, path: 'src/services/settlement.ts', line: 500 })
    // Line Node 越界剔除，仅剩整文件覆盖的 Settle Node
    expect(outRange.nodes.map((n) => n.nodeName)).toEqual(['Settle Node'])
  })

  it('跨团队隔离：查询本团队不返回他团队节点', async () => {
    const result = await service.findNodesByPath({ teamId, path: 'src/services/settlement.ts' })
    expect(result.nodes.some((n) => n.nodeName === 'Foreign')).toBe(false)
  })

  it('无匹配返回空', async () => {
    const result = await service.findNodesByPath({ teamId, path: 'src/does/not/exist.ts' })
    expect(result.count).toBe(0)
    expect(result.nodes).toEqual([])
  })
})
