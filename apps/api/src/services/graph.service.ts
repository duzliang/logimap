import { prisma } from '../db/prisma.js'

export class GraphService {
  async getGraphData(moduleId: string) {
    // 获取模块下所有节点
    const nodes = await prisma.logicNode.findMany({
      where: { moduleId },
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        module: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // 获取所有连线
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { source: { moduleId } },
          { target: { moduleId } }
        ]
      }
    })

    return {
      nodes: nodes.map((node) => ({
        ...node,
        branches: node.branches as any[],
        edgeCases: node.edgeCases as any[]
      })),
      connections
    }
  }

  async createConnection(
    sourceId: string,
    targetId: string,
    type: string,
    label?: string,
    description?: string
  ) {
    // 检查节点是否存在
    const sourceNode = await prisma.logicNode.findUnique({
      where: { id: sourceId }
    })

    if (!sourceNode) {
      throw new Error('源节点不存在')
    }

    const targetNode = await prisma.logicNode.findUnique({
      where: { id: targetId }
    })

    if (!targetNode) {
      throw new Error('目标节点不存在')
    }

    // 检查是否已存在
    const existing = await prisma.connection.findFirst({
      where: {
        sourceId,
        targetId
      }
    })

    if (existing) {
      throw new Error('该连线已存在')
    }

    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 8)
      return `${timestamp}${random}`
    }

    return prisma.connection.create({
      data: {
        id: generateId(),
        sourceId,
        targetId,
        type: type as any,
        label,
        description
      }
    })
  }

  async updateConnection(
    connId: string,
    data: { label?: string | null; description?: string | null; type?: 'TRIGGERS' | 'DEPENDS_ON' | 'BLOCKS' | 'EXTENDS' }
  ) {
    const updateData: any = {}
    if (data.label !== undefined) updateData.label = data.label
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type

    return prisma.connection.update({
      where: { id: connId },
      data: updateData
    })
  }

  async deleteConnection(connId: string) {
    const conn = await prisma.connection.findUnique({
      where: { id: connId }
    })

    if (!conn) {
      throw new Error('连线不存在')
    }

    await prisma.connection.delete({
      where: { id: connId }
    })
  }
}
