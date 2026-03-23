import { prisma } from '../db/prisma.js'
import type { CreateLogicNodeInput, UpdateLogicNodeInput, UpdatePositionInput } from '../lib/validators.logic-node.js'

export class LogicNodesService {
  async getAll(moduleId: string) {
    const nodes = await prisma.logicNode.findMany({
      where: { moduleId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        updatedBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return nodes.map((node) => ({
      ...node,
      branches: node.branches as any[],
      edgeCases: node.edgeCases as any[]
    }))
  }

  async getById(nodeId: string) {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        updatedBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true, system: { select: { id: true, name: true } } }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 10
        }
      }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    return {
      ...node,
      branches: node.branches as any[],
      edgeCases: node.edgeCases as any[]
    }
  }

  async create(moduleId: string, input: CreateLogicNodeInput, userId: string) {
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 8)
      return `${timestamp}${random}`
    }

    const node = await prisma.logicNode.create({
      data: {
        id: generateId(),
        moduleId,
        createdById: userId,
        ...input,
        branches: input.branches as any,
        edgeCases: input.edgeCases as any
      },
      include: {
        module: {
          select: { id: true, name: true }
        }
      }
    })

    return {
      ...node,
      branches: node.branches as any[],
      edgeCases: node.edgeCases as any[]
    }
  }

  async update(nodeId: string, input: UpdateLogicNodeInput, userId: string) {
    const existingNode = await prisma.logicNode.findUnique({
      where: { id: nodeId }
    })

    if (!existingNode) {
      throw new Error('节点不存在')
    }

    // 创建版本快照
    await prisma.logicNodeVersion.create({
      data: {
        id: `${nodeId}-${Date.now()}`,
        nodeId,
        version: await this.getNextVersion(nodeId),
        snapshot: {
          ...existingNode,
          branches: existingNode.branches,
          edgeCases: existingNode.edgeCases
        } as any,
        changeNote: input.name ? `更新节点：${existingNode.name}` : undefined
      }
    })

    // 更新节点
    const updateData: any = { ...input }
    if (input.branches !== undefined) updateData.branches = input.branches as any
    if (input.edgeCases !== undefined) updateData.edgeCases = input.edgeCases as any
    updateData.updatedById = userId

    const node = await prisma.logicNode.update({
      where: { id: nodeId },
      data: updateData,
      include: {
        module: {
          select: { id: true, name: true }
        }
      }
    })

    return {
      ...node,
      branches: node.branches as any[],
      edgeCases: node.edgeCases as any[]
    }
  }

  async updatePosition(nodeId: string, input: UpdatePositionInput) {
    const node = await prisma.logicNode.update({
      where: { id: nodeId },
      data: {
        positionX: input.positionX,
        positionY: input.positionY
      }
    })

    return node
  }

  async delete(nodeId: string) {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    await prisma.logicNode.delete({
      where: { id: nodeId }
    })
  }

  async getVersions(nodeId: string) {
    const versions = await prisma.logicNodeVersion.findMany({
      where: { nodeId },
      orderBy: { version: 'desc' }
    })

    return versions
  }

  async restoreVersion(nodeId: string, version: number) {
    const versionData = await prisma.logicNodeVersion.findUnique({
      where: {
        nodeId_version: {
          nodeId,
          version
        }
      }
    })

    if (!versionData) {
      throw new Error('版本不存在')
    }

    const snapshot = versionData.snapshot as any

    // 创建当前版本的快照
    const existingNode = await prisma.logicNode.findUnique({
      where: { id: nodeId }
    })

    if (existingNode) {
      await prisma.logicNodeVersion.create({
        data: {
          id: `${nodeId}-${Date.now()}-before-restore`,
          nodeId,
          version: await this.getNextVersion(nodeId),
          snapshot: {
            ...existingNode,
            branches: existingNode.branches,
            edgeCases: existingNode.edgeCases
          } as any,
          changeNote: `恢复版本前的快照`
        }
      })
    }

    // 恢复到指定版本
    const node = await prisma.logicNode.update({
      where: { id: nodeId },
      data: {
        name: snapshot.name,
        summary: snapshot.summary,
        status: snapshot.status,
        priority: snapshot.priority,
        trigger: snapshot.trigger,
        dependsOn: snapshot.dependsOn,
        mainFlow: snapshot.mainFlow,
        branches: snapshot.branches,
        edgeCases: snapshot.edgeCases,
        codeRef: snapshot.codeRef,
        tags: snapshot.tags,
        notes: snapshot.notes,
        positionX: snapshot.positionX,
        positionY: snapshot.positionY
      }
    })

    return {
      ...node,
      branches: node.branches as any[],
      edgeCases: node.edgeCases as any[]
    }
  }

  private async getNextVersion(nodeId: string): Promise<number> {
    const lastVersion = await prisma.logicNodeVersion.findFirst({
      where: { nodeId },
      orderBy: { version: 'desc' }
    })

    return (lastVersion?.version || 0) + 1
  }
}
