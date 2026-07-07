import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SearchService } from '../services/search.service.js'
import { prisma } from '../db/prisma.js'
import {
  createUser,
  createTeam,
  addTeamMember,
  createSystem,
  createModule,
  createLogicNode,
  cleanupSearchTestData
} from '../test/factories.js'

const service = new SearchService()

describe('SearchService', () => {
  beforeEach(async () => {
    await cleanupSearchTestData()
  })

  afterEach(async () => {
    await cleanupSearchTestData()
  })

  async function setupTeamWithData(role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'VIEWER') {
    const user = await createUser()
    const team = await createTeam()
    await addTeamMember(user.id, team.id, role)
    const system = await createSystem(team.id, { name: 'Billing System', description: 'Handles billing' })
    const moduleA = await createModule(system.id, { name: 'Invoice Module', description: 'Invoices' })
    const node = await createLogicNode(moduleA.id, user.id, {
      name: 'Create Invoice',
      summary: 'Create an invoice for the customer',
      status: 'DRAFT',
      priority: 'HIGH',
      tags: ['billing', 'invoice'],
      codeRef: 'src/invoices/create.ts'
    })
    return { user, team, system, module: moduleA, node }
  }

  it('returns systems matching the query', async () => {
    const { team } = await setupTeamWithData()
    const result = await service.search({ teamId: team.id, q: 'Billing' })

    expect(result.systems.items).toHaveLength(1)
    expect(result.systems.items[0].title).toBe('Billing System')
  })

  it('returns modules and nodes matching the query', async () => {
    const { team, node } = await setupTeamWithData()
    const result = await service.search({ teamId: team.id, q: 'Invoice' })

    expect(result.modules.items.some((m) => m.title === 'Invoice Module')).toBe(true)
    expect(result.nodes.items.some((n) => n.id === node.id)).toBe(true)
  })

  it('filters nodes by status and priority', async () => {
    const { team, node } = await setupTeamWithData()
    const result = await service.search({
      teamId: team.id,
      statuses: 'DRAFT',
      priorities: 'HIGH'
    })

    expect(result.nodes.items.some((n) => n.id === node.id)).toBe(true)
    expect(result.nodes.items[0].status).toBe('DRAFT')
    expect(result.nodes.items[0].priority).toBe('HIGH')
  })

  it('filters nodes by tags', async () => {
    const { team, node } = await setupTeamWithData()
    const result = await service.search({ teamId: team.id, tags: 'billing,invoice' })

    expect(result.nodes.items.some((n) => n.id === node.id)).toBe(true)
  })

  it('filters nodes by assignee (createdById)', async () => {
    const { team, user, node } = await setupTeamWithData()
    const result = await service.search({ teamId: team.id, assigneeId: user.id })

    expect(result.nodes.items.some((n) => n.id === node.id)).toBe(true)
    expect(result.nodes.items[0].assignee?.id).toBe(user.id)
  })

  it('scopes results by system and module', async () => {
    const { team, system, module: moduleA, node, user } = await setupTeamWithData()
    const otherSystem = await createSystem(team.id, { name: 'Other System' })
    const otherModule = await createModule(otherSystem.id, { name: 'Other Module' })
    await createLogicNode(otherModule.id, user.id, {
      name: 'Other Node',
      summary: 'Should not appear'
    })

    const bySystem = await service.search({ teamId: team.id, systemId: system.id })
    expect(bySystem.nodes.items.some((n) => n.id === node.id)).toBe(true)
    expect(bySystem.nodes.items.some((n) => n.title === 'Other Node')).toBe(false)

    const byModule = await service.search({ teamId: team.id, moduleId: moduleA.id })
    expect(byModule.nodes.items.some((n) => n.id === node.id)).toBe(true)
    expect(byModule.nodes.items.some((n) => n.title === 'Other Node')).toBe(false)
  })

  it('does not return results from other teams', async () => {
    const { team } = await setupTeamWithData()
    const otherTeam = await createTeam()
    await createSystem(otherTeam.id, { name: 'Secret System' })

    const result = await service.search({ teamId: team.id, q: 'Secret' })
    expect(result.systems.items).toHaveLength(0)
  })

  it('supports pagination', async () => {
    const { team } = await setupTeamWithData()
    const result = await service.search({ teamId: team.id, limit: 1, offset: 0 })

    expect(result.systems.limit).toBe(1)
    expect(result.systems.offset).toBe(0)
    expect(result.systems.items.length).toBeLessThanOrEqual(1)
  })

  it('resolves within 200ms', async () => {
    const { team } = await setupTeamWithData()
    const start = Date.now()
    await service.search({ teamId: team.id, q: 'Invoice' })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(200)
  })
})
