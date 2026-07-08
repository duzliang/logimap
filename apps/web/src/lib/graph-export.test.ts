import { describe, it, expect } from 'vitest'
import { buildGraphMarkdown, slugForFile } from './graph-export'
import type { GraphData } from '@/api/graph.api'
import type { LogicNode } from '@/types/logic-node.types'

function node(overrides: Partial<LogicNode> & { id: string; name: string }): LogicNode {
  return {
    summary: null,
    status: 'DRAFT',
    priority: 'NORMAL',
    trigger: null,
    dependsOn: null,
    mainFlow: null,
    branches: null,
    edgeCases: null,
    codeRef: null,
    tags: [],
    notes: null,
    positionX: 0,
    positionY: 0,
    moduleId: 'm1',
    createdAt: '',
    updatedAt: '',
    ...overrides
  }
}

describe('buildGraphMarkdown', () => {
  const data: GraphData = {
    nodes: [
      node({ id: 'a', name: '创建工单', status: 'APPROVED', priority: 'HIGH', summary: '入口', codeRef: 'src/order.ts#create', tags: ['core'] }),
      node({ id: 'b', name: '结算', trigger: '工单完成' })
    ],
    connections: [
      { id: 'c1', sourceId: 'a', targetId: 'b', type: 'TRIGGERS', label: '完成后', description: null, createdAt: '' }
    ]
  }

  it('包含标题与统计', () => {
    const md = buildGraphMarkdown(data, '订单模块')
    expect(md).toContain('# 订单模块')
    expect(md).toContain('节点数：2')
    expect(md).toContain('连线数：1')
  })

  it('渲染节点字段（中文状态/优先级、代码关联、标签）', () => {
    const md = buildGraphMarkdown(data, 'M')
    expect(md).toContain('### 创建工单')
    expect(md).toContain('状态：已确认 ｜ 优先级：高')
    expect(md).toContain('代码关联：`src/order.ts#create`')
    expect(md).toContain('标签：core')
    expect(md).toContain('触发条件：工单完成')
  })

  it('用节点名称渲染关系', () => {
    const md = buildGraphMarkdown(data, 'M')
    expect(md).toContain('创建工单 —[触发]→ 结算（完成后）')
  })

  it('空图谱给出占位文本', () => {
    const md = buildGraphMarkdown({ nodes: [], connections: [] }, 'Empty')
    expect(md).toContain('（暂无节点）')
    expect(md).toContain('（暂无连线）')
  })
})

describe('slugForFile', () => {
  it('生成带日期的文件名', () => {
    expect(slugForFile('订单')).toMatch(/^logimap-订单-\d{4}-\d{2}-\d{2}$/)
  })
})
