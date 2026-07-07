import { prisma } from '../db/prisma.js'
import type { ConnectionType } from '@logimap/types'

export type ImpactDirection = 'downstream' | 'upstream' | 'both'

export interface ImpactNode {
  id: string
  name: string
  status: string
  depth: number
  path: string[]
}

export interface ImpactPath {
  fromId: string
  toId: string
  type: ConnectionType
  depth: number
}

export interface ImpactScope {
  startNodeId: string
  direction: ImpactDirection
  maxDepth: number
  direct: ImpactNode[]
  indirect: ImpactNode[]
  thirdLevel: ImpactNode[]
  paths: ImpactPath[]
}

export interface HypotheticalChanges {
  addConnections?: Array<{ sourceId: string; targetId: string; type?: ConnectionType }>
  removeConnectionIds?: string[]
}

export class ImpactAnalysisService {
  /**
   * 分析指定节点在模块内的影响范围
   */
  async analyzeImpact(
    nodeId: string,
    direction: ImpactDirection = 'downstream',
    maxDepth: number = 3
  ): Promise<ImpactScope> {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      select: { id: true, name: true, status: true, moduleId: true }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    const { nodes, connections } = await this.loadModuleGraph(node.moduleId)
    return this.computeImpact(nodeId, direction, maxDepth, nodes, connections)
  }

  /**
   * 假设分析：在内存中应用临时变更后计算影响范围
   */
  async whatIfImpact(
    nodeId: string,
    changes: HypotheticalChanges,
    direction: ImpactDirection = 'downstream',
    maxDepth: number = 3
  ): Promise<ImpactScope> {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      select: { id: true, name: true, status: true, moduleId: true }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    const { nodes, connections } = await this.loadModuleGraph(node.moduleId)

    const removedIds = new Set(changes.removeConnectionIds ?? [])
    const modifiedConnections = connections
      .filter((c) => !removedIds.has(c.id))
      .concat(
        (changes.addConnections ?? []).map((c, index) => ({
          id: `what-if-${index}`,
          sourceId: c.sourceId,
          targetId: c.targetId,
          type: c.type ?? 'TRIGGERS',
          label: null,
          description: null,
          createdAt: new Date()
        }))
      )

    return this.computeImpact(nodeId, direction, maxDepth, nodes, modifiedConnections)
  }

  private async loadModuleGraph(moduleId: string) {
    const nodes = await prisma.logicNode.findMany({
      where: { moduleId },
      select: { id: true, name: true, status: true }
    })

    const nodeIds = new Set(nodes.map((n) => n.id))

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { sourceId: { in: Array.from(nodeIds) } },
          { targetId: { in: Array.from(nodeIds) } }
        ]
      }
    })

    return { nodes, connections }
  }

  private computeImpact(
    startNodeId: string,
    direction: ImpactDirection,
    maxDepth: number,
    nodes: Array<{ id: string; name: string; status: string }>,
    connections: Array<{ id: string; sourceId: string; targetId: string; type: ConnectionType }>
  ): ImpactScope {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    const outgoing = new Map<string, Array<{ targetId: string; type: ConnectionType }>>()
    const incoming = new Map<string, Array<{ sourceId: string; type: ConnectionType }>>()

    for (const conn of connections) {
      if (!outgoing.has(conn.sourceId)) outgoing.set(conn.sourceId, [])
      outgoing.get(conn.sourceId)!.push({ targetId: conn.targetId, type: conn.type })

      if (!incoming.has(conn.targetId)) incoming.set(conn.targetId, [])
      incoming.get(conn.targetId)!.push({ sourceId: conn.sourceId, type: conn.type })
    }

    const visited = new Map<string, { depth: number; path: string[] }>()
    const paths: ImpactPath[] = []
    const queue: Array<{ id: string; depth: number; path: string[] }> = [{ id: startNodeId, depth: 0, path: [startNodeId] }]

    visited.set(startNodeId, { depth: 0, path: [startNodeId] })

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.depth >= maxDepth) continue

      const neighbors: Array<{ id: string; type: ConnectionType; via: 'out' | 'in' }> = []

      if (direction === 'downstream' || direction === 'both') {
        for (const edge of outgoing.get(current.id) ?? []) {
          neighbors.push({ id: edge.targetId, type: edge.type, via: 'out' })
        }
      }

      if (direction === 'upstream' || direction === 'both') {
        for (const edge of incoming.get(current.id) ?? []) {
          neighbors.push({ id: edge.sourceId, type: edge.type, via: 'in' })
        }
      }

      for (const neighbor of neighbors) {
        const nextDepth = current.depth + 1
        const nextPath = [...current.path, neighbor.id]

        paths.push({
          fromId: neighbor.via === 'out' ? current.id : neighbor.id,
          toId: neighbor.via === 'out' ? neighbor.id : current.id,
          type: neighbor.type,
          depth: nextDepth
        })

        if (!visited.has(neighbor.id) || visited.get(neighbor.id)!.depth > nextDepth) {
          visited.set(neighbor.id, { depth: nextDepth, path: nextPath })
          queue.push({ id: neighbor.id, depth: nextDepth, path: nextPath })
        }
      }
    }

    const direct: ImpactNode[] = []
    const indirect: ImpactNode[] = []
    const thirdLevel: ImpactNode[] = []

    for (const [id, meta] of visited.entries()) {
      if (id === startNodeId) continue
      const node = nodeMap.get(id)
      if (!node) continue

      const impactNode: ImpactNode = {
        id,
        name: node.name,
        status: node.status,
        depth: meta.depth,
        path: meta.path
      }

      if (meta.depth === 1) direct.push(impactNode)
      else if (meta.depth === 2) indirect.push(impactNode)
      else if (meta.depth === 3) thirdLevel.push(impactNode)
    }

    return {
      startNodeId,
      direction,
      maxDepth,
      direct,
      indirect,
      thirdLevel,
      paths
    }
  }
}
