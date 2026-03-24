import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface GenerateNodeContentInput {
  nodeName: string
  moduleContext?: string
  existingContent?: {
    trigger?: string
    dependsOn?: string
    mainFlow?: string
  }
}

interface GeneratedNodeContent {
  trigger: string
  dependsOn: string
  mainFlow: string
  branches: Array<{ condition: string; action: string }>
  edgeCases: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
}

interface AnalyzeNodeInput {
  nodeName: string
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches?: Array<{ condition: string; action: string }>
  edgeCases?: Array<{ scenario: string; handling: string; severity: string }>
}

interface NodeAnalysis {
  completeness: number // 0-100
  suggestions: string[]
  missingEdgeCases: string[]
  recommendedBranches: string[]
}

export class AIService {
  /**
   * 生成逻辑节点内容建议
   */
  async generateNodeContent(input: GenerateNodeContentInput): Promise<GeneratedNodeContent> {
    const contextPrompt = input.moduleContext
      ? `模块上下文：${input.moduleContext}`
      : ''

    const existingPrompt = input.existingContent
      ? `已有内容：
触发条件：${input.existingContent.trigger || '无'}
前置依赖：${input.existingContent.dependsOn || '无'}
主流程：${input.existingContent.mainFlow || '无'}`
      : ''

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `你是一个业务逻辑分析专家。请为以下业务逻辑节点生成内容建议。

节点名称：${input.nodeName}
${contextPrompt}
${existingPrompt}

请按以下 JSON 格式返回结果：
{
  "trigger": "触发条件的描述",
  "dependsOn": "前置依赖的描述",
  "mainFlow": "主流程步骤（使用编号列表）",
  "branches": [
    { "condition": "分支条件", "action": "分支动作" }
  ],
  "edgeCases": [
    { "scenario": "边界场景", "handling": "处理方式", "severity": "critical/warning/info" }
  ]
}

只返回 JSON，不要其他内容。`
      }]
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } =>
      block.type === 'text'
    )

    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    // 提取 JSON
    let jsonStr = textBlock.text.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    return JSON.parse(jsonStr) as GeneratedNodeContent
  }

  /**
   * 分析逻辑节点完整性
   */
  async analyzeNode(input: AnalyzeNodeInput): Promise<NodeAnalysis> {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `你是一个业务逻辑分析专家。请分析以下逻辑节点的完整性和质量。

节点名称：${input.nodeName}
触发条件：${input.trigger || '未填写'}
前置依赖：${input.dependsOn || '未填写'}
主流程：${input.mainFlow || '未填写'}
分支条件：${JSON.stringify(input.branches || [])}
边界条件：${JSON.stringify(input.edgeCases || [])}

请按以下 JSON 格式返回分析结果：
{
  "completeness": 85,
  "suggestions": ["改进建议1", "改进建议2"],
  "missingEdgeCases": ["可能遗漏的边界场景1", "可能遗漏的边界场景2"],
  "recommendedBranches": ["建议添加的分支条件1"]
}

只返回 JSON，不要其他内容。`
      }]
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } =>
      block.type === 'text'
    )

    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    let jsonStr = textBlock.text.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    return JSON.parse(jsonStr) as NodeAnalysis
  }

  /**
   * 生成边界条件建议
   */
  async suggestEdgeCases(
    nodeName: string,
    mainFlow: string,
    existingEdgeCases: Array<{ scenario: string; handling: string }> = []
  ): Promise<Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>> {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `你是一个业务逻辑分析专家。请为以下业务逻辑生成可能遗漏的边界条件。

节点名称：${nodeName}
主流程：${mainFlow}
已有边界条件：${JSON.stringify(existingEdgeCases)}

请生成可能遗漏的边界条件，按以下 JSON 格式返回：
[
  { "scenario": "边界场景描述", "handling": "建议的处理方式", "severity": "critical/warning/info" }
]

只返回 JSON 数组，不要其他内容。最多返回 5 个建议。`
      }]
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } =>
      block.type === 'text'
    )

    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    let jsonStr = textBlock.text.trim()
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    return JSON.parse(jsonStr)
  }

  /**
   * 生成测试用例
   */
  async generateTestCases(input: AnalyzeNodeInput): Promise<{
    normalCases: Array<{ name: string; steps: string[]; expected: string }>
    edgeCases: Array<{ name: string; steps: string[]; expected: string }>
    branchCases: Array<{ name: string; condition: string; steps: string[]; expected: string }>
  }> {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `你是一个测试用例设计专家。请为以下业务逻辑生成测试用例。

节点名称：${input.nodeName}
触发条件：${input.trigger || '未填写'}
前置依赖：${input.dependsOn || '未填写'}
主流程：${input.mainFlow || '未填写'}
分支条件：${JSON.stringify(input.branches || [])}
边界条件：${JSON.stringify(input.edgeCases || [])}

请按以下 JSON 格式返回测试用例：
{
  "normalCases": [
    { "name": "正常流程测试", "steps": ["步骤1", "步骤2"], "expected": "预期结果" }
  ],
  "edgeCases": [
    { "name": "边界条件测试", "steps": ["步骤1", "步骤2"], "expected": "预期结果" }
  ],
  "branchCases": [
    { "name": "分支测试", "condition": "分支条件", "steps": ["步骤1"], "expected": "预期结果" }
  ]
}

只返回 JSON，不要其他内容。每类最多 3 个测试用例。`
      }]
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } =>
      block.type === 'text'
    )

    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    let jsonStr = textBlock.text.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    return JSON.parse(jsonStr)
  }
}