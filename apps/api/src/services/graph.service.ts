import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import type { Branch, EdgeCase, ConnectionType } from '@logimap/types'

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
        source: { moduleId },
        target: { moduleId }
      }
    })

    return {
      nodes: nodes.map((node) => ({
        ...node,
        branches: node.branches as Branch[],
        edgeCases: node.edgeCases as EdgeCase[]
      })),
      connections
    }
  }

  async createConnection(
    sourceId: string,
    targetId: string,
    type: ConnectionType,
    label?: string,
    description?: string
  ) {
    const [sourceNode, targetNode] = await Promise.all([
      prisma.logicNode.findUnique({ where: { id: sourceId } }),
      prisma.logicNode.findUnique({ where: { id: targetId } })
    ])

    if (!sourceNode) {
      throw new Error('源节点不存在')
    }

    if (!targetNode) {
      throw new Error('目标节点不存在')
    }

    const existing = await prisma.connection.findFirst({
      where: {
        sourceId,
        targetId
      }
    })

    if (existing) {
      throw new Error('该连线已存在')
    }

    return prisma.connection.create({
      data: {
        id: generateId(),
        sourceId,
        targetId,
        type,
        label,
        description
      }
    })
  }

  async updateConnection(
    connId: string,
    data: { label?: string | null; description?: string | null; type?: ConnectionType }
  ) {
    const updateData: Prisma.ConnectionUpdateInput = {}
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
