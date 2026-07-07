import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../db/prisma.js'
import { ImpactAnalysisService } from './impact-analysis.service.js'
import { generateId } from '../lib/id-generator.js'

async function createTestModule() {
  const team = await prisma.team.create({
    data: {
      id: generateId(),
      name: 'Impact Test Team',
      slug: `impact-test-${Date.now()}`
    }
  })

  const system = await prisma.system.create({
    data: {
      id: generateId(),
      name: 'Test System',
      slug: 'test-system',
      teamId: team.id
    }
  })

  const moduleEntity = await prisma.module.create({
    data: {
      id: generateId(),
      name: 'Test Module',
      slug: 'test-module',
      systemId: system.id
    }
  })

  return { team, system, module: moduleEntity }
}

async function createTestNode(moduleId: string, name: string) {
  return prisma.logicNode.create({
    data: {
      id: generateId(),
      name,
      moduleId
    }
  })
}

async function createConnection(sourceId: string, targetId: string) {
  return prisma.connection.create({
    data: {
      id: generateId(),
      sourceId,
      targetId,
      type: 'TRIGGERS'
    }
  })
}

describe('ImpactAnalysisService', () => {
  const service = new ImpactAnalysisService()

  beforeEach(async () => {
    await prisma.connection.deleteMany()
    await prisma.logicNode.deleteMany()
    await prisma.module.deleteMany()
    await prisma.system.deleteMany()
    await prisma.team.deleteMany()
  })

  it('should calculate downstream impact up to 3 levels', async () => {
    const { module } = await createTestModule()
    const nodeA = await createTestNode(module.id, 'A')
    const nodeB = await createTestNode(module.id, 'B')
    const nodeC = await createTestNode(module.id, 'C')
    const nodeD = await createTestNode(module.id, 'D')

    await createConnection(nodeA.id, nodeB.id)
    await createConnection(nodeB.id, nodeC.id)
    await createConnection(nodeC.id, nodeD.id)

    const scope = await service.analyzeImpact(nodeA.id, 'downstream', 3)

    expect(scope.startNodeId).toBe(nodeA.id)
    expect(scope.direct).toHaveLength(1)
    expect(scope.direct[0].id).toBe(nodeB.id)
    expect(scope.indirect).toHaveLength(1)
    expect(scope.indirect[0].id).toBe(nodeC.id)
    expect(scope.thirdLevel).toHaveLength(1)
    expect(scope.thirdLevel[0].id).toBe(nodeD.id)
  })

  it('should calculate upstream impact', async () => {
    const { module } = await createTestModule()
    const nodeA = await createTestNode(module.id, 'A')
    const nodeB = await createTestNode(module.id, 'B')
    const nodeC = await createTestNode(module.id, 'C')

    await createConnection(nodeA.id, nodeB.id)
    await createConnection(nodeB.id, nodeC.id)

    const scope = await service.analyzeImpact(nodeC.id, 'upstream', 3)

    expect(scope.direct).toHaveLength(1)
    expect(scope.direct[0].id).toBe(nodeB.id)
    expect(scope.indirect).toHaveLength(1)
    expect(scope.indirect[0].id).toBe(nodeA.id)
  })

  it('should respect maxDepth', async () => {
    const { module } = await createTestModule()
    const nodeA = await createTestNode(module.id, 'A')
    const nodeB = await createTestNode(module.id, 'B')
    const nodeC = await createTestNode(module.id, 'C')

    await createConnection(nodeA.id, nodeB.id)
    await createConnection(nodeB.id, nodeC.id)

    const scope = await service.analyzeImpact(nodeA.id, 'downstream', 1)

    expect(scope.direct).toHaveLength(1)
    expect(scope.indirect).toHaveLength(0)
    expect(scope.thirdLevel).toHaveLength(0)
  })

  it('should handle cycles without infinite loops', async () => {
    const { module } = await createTestModule()
    const nodeA = await createTestNode(module.id, 'A')
    const nodeB = await createTestNode(module.id, 'B')

    await createConnection(nodeA.id, nodeB.id)
    await createConnection(nodeB.id, nodeA.id)

    const scope = await service.analyzeImpact(nodeA.id, 'downstream', 3)

    expect(scope.direct).toHaveLength(1)
    expect(scope.indirect).toHaveLength(0)
  })

  it('should preview what-if connections without persisting', async () => {
    const { module } = await createTestModule()
    const nodeA = await createTestNode(module.id, 'A')
    const nodeB = await createTestNode(module.id, 'B')

    const scope = await service.whatIfImpact(
      nodeA.id,
      {
        addConnections: [{ sourceId: nodeA.id, targetId: nodeB.id, type: 'TRIGGERS' }]
      },
      'downstream',
      3
    )

    expect(scope.direct).toHaveLength(1)
    expect(scope.direct[0].id).toBe(nodeB.id)

    const persisted = await prisma.connection.findMany({
      where: { sourceId: nodeA.id, targetId: nodeB.id }
    })
    expect(persisted).toHaveLength(0)
  })
})
