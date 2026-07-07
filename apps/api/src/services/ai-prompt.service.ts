import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'

export interface PromptDefinition {
  key: string
  version: number
  variant: string
  description?: string
  systemPrompt?: string
  userPromptTemplate: string
  model: string
  temperature: number
  maxTokens: number
  responseSchema?: z.ZodType<unknown>
  isDefault: boolean
  teamId?: string | null
}

export interface BuiltInPrompt extends PromptDefinition {
  responseSchema: z.ZodType<unknown>
}

export class AiPromptService {
  /**
   * 获取指定 key 的默认 prompt，优先从数据库读取，否则返回内置 fallback
   */
  async getPrompt(key: string, teamId?: string | null): Promise<PromptDefinition> {
    const fromDb = await prisma.aiPromptVersion.findFirst({
      where: {
        key,
        isDefault: true,
        OR: [{ teamId: teamId ?? null }, { teamId: null }]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (fromDb) {
      return {
        key: fromDb.key,
        version: fromDb.version,
        variant: fromDb.variant,
        description: fromDb.description ?? undefined,
        systemPrompt: fromDb.systemPrompt ?? undefined,
        userPromptTemplate: fromDb.userPromptTemplate,
        model: fromDb.model,
        temperature: fromDb.temperature,
        maxTokens: fromDb.maxTokens,
        responseSchema: fromDb.responseSchema ? this.parseSchema(fromDb.responseSchema) : undefined,
        isDefault: fromDb.isDefault,
        teamId: fromDb.teamId
      }
    }

    const builtIn = this.getBuiltInPrompt(key)
    if (!builtIn) {
      throw new Error(`未找到 prompt: ${key}`)
    }

    return builtIn
  }

  /**
   * 列出某个 key 的所有 prompt 版本
   */
  async listPrompts(key?: string, teamId?: string | null) {
    return prisma.aiPromptVersion.findMany({
      where: {
        ...(key ? { key } : {}),
        OR: [{ teamId: teamId ?? null }, { teamId: null }]
      },
      orderBy: [{ key: 'asc' }, { version: 'desc' }]
    })
  }

  /**
   * 创建新的 prompt 版本
   */
  async createPrompt(data: Omit<PromptDefinition, 'version'> & { key: string }) {
    const latest = await prisma.aiPromptVersion.findFirst({
      where: { key: data.key },
      orderBy: { version: 'desc' }
    })

    const version = (latest?.version ?? 0) + 1

    if (data.isDefault) {
      await prisma.aiPromptVersion.updateMany({
        where: { key: data.key, isDefault: true },
        data: { isDefault: false }
      })
    }

    return prisma.aiPromptVersion.create({
      data: {
        id: generateId(),
        key: data.key,
        version,
        variant: data.variant || 'default',
        description: data.description,
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        ...(data.responseSchema
          ? { responseSchema: this.serializeSchema(data.responseSchema) as Prisma.InputJsonValue }
          : {}),
        isDefault: data.isDefault,
        teamId: data.teamId ?? null
      }
    })
  }

  /**
   * 渲染 prompt 模板
   */
  renderTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key]
      if (value === undefined || value === null) return ''
      if (typeof value === 'string') return value
      return JSON.stringify(value, null, 2)
    })
  }

  /**
   * 从 AI 文本响应中提取 JSON 并校验
   */
  parseJsonResponse<T>(text: string, schema?: z.ZodType<T>): T {
    let jsonStr = text.trim()

    // 尝试提取 ```json ... ``` 代码块
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    // 兜底：提取第一个 JSON 对象或数组
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)

    if (objectMatch) {
      jsonStr = objectMatch[0]
    } else if (arrayMatch) {
      jsonStr = arrayMatch[0]
    }

    const parsed = JSON.parse(jsonStr)

    if (schema) {
      const result = schema.safeParse(parsed)
      if (!result.success) {
        throw new Error(`AI 输出校验失败: ${result.error.message}`)
      }
      return result.data
    }

    return parsed as T
  }

  private getBuiltInPrompt(key: string): BuiltInPrompt | null {
    return builtInPrompts[key] ?? null
  }

  private parseSchema(schemaJson: unknown): z.ZodType<unknown> | undefined {
    // 简化处理：数据库中存储的 schema 目前仅作元数据，实际校验使用内置 schema
    return undefined
  }

  private serializeSchema(_schema: z.ZodType<unknown>): unknown {
    // 简化处理：仅保存占位符
    return { type: 'zod', serialized: true }
  }
}

const GeneratedNodeContentSchema = z.object({
  trigger: z.string(),
  dependsOn: z.string(),
  mainFlow: z.string(),
  branches: z.array(z.object({ condition: z.string(), action: z.string() })),
  edgeCases: z.array(
    z.object({
      scenario: z.string(),
      handling: z.string(),
      severity: z.enum(['critical', 'warning', 'info'])
    })
  )
})

const NodeAnalysisSchema = z.object({
  completeness: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
  missingEdgeCases: z.array(z.string()),
  recommendedBranches: z.array(z.string())
})

const EdgeCasesSchema = z.array(
  z.object({
    scenario: z.string(),
    handling: z.string(),
    severity: z.enum(['critical', 'warning', 'info'])
  })
)

const TestCasesSchema = z.object({
  normalCases: z.array(z.object({ name: z.string(), steps: z.array(z.string()), expected: z.string() })),
  edgeCases: z.array(z.object({ name: z.string(), steps: z.array(z.string()), expected: z.string() })),
  branchCases: z.array(
    z.object({
      name: z.string(),
      condition: z.string(),
      steps: z.array(z.string()),
      expected: z.string()
    })
  )
})

const builtInPrompts: Record<string, BuiltInPrompt> = {
  'generate-node': {
    key: 'generate-node',
    version: 1,
    variant: 'default',
    description: '生成逻辑节点内容建议',
    systemPrompt: '你是一个业务逻辑分析专家。请严格按用户要求的 JSON 格式返回结果，只返回 JSON，不要其他内容。',
    userPromptTemplate: `请为以下业务逻辑节点生成内容建议。

节点名称：{{nodeName}}
模块上下文：{{moduleContext}}
已有内容：{{existingContent}}

请按以下 JSON 格式返回结果：
{
  "trigger": "触发条件的描述",
  "dependsOn": "前置依赖的描述",
  "mainFlow": "主流程步骤（使用编号列表）",
  "branches": [{ "condition": "分支条件", "action": "分支动作" }],
  "edgeCases": [{ "scenario": "边界场景", "handling": "处理方式", "severity": "critical/warning/info" }]
}

只返回 JSON，不要其他内容。`,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    maxTokens: 2000,
    responseSchema: GeneratedNodeContentSchema,
    isDefault: true
  },
  'analyze-node': {
    key: 'analyze-node',
    version: 1,
    variant: 'default',
    description: '分析逻辑节点完整性',
    systemPrompt: '你是一个业务逻辑分析专家。请严格按用户要求的 JSON 格式返回分析结果，只返回 JSON。',
    userPromptTemplate: `请分析以下逻辑节点的完整性和质量。

节点名称：{{nodeName}}
触发条件：{{trigger}}
前置依赖：{{dependsOn}}
主流程：{{mainFlow}}
分支条件：{{branches}}
边界条件：{{edgeCases}}

请按以下 JSON 格式返回分析结果：
{
  "completeness": 85,
  "suggestions": ["改进建议1"],
  "missingEdgeCases": ["可能遗漏的边界场景1"],
  "recommendedBranches": ["建议添加的分支条件1"]
}

只返回 JSON，不要其他内容。`,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    maxTokens: 1500,
    responseSchema: NodeAnalysisSchema,
    isDefault: true
  },
  'suggest-edge-cases': {
    key: 'suggest-edge-cases',
    version: 1,
    variant: 'default',
    description: '建议遗漏的边界条件',
    systemPrompt: '你是一个业务逻辑分析专家。请严格按用户要求的 JSON 数组格式返回结果。',
    userPromptTemplate: `请为以下业务逻辑生成可能遗漏的边界条件。

节点名称：{{nodeName}}
主流程：{{mainFlow}}
已有边界条件：{{existingEdgeCases}}

请生成可能遗漏的边界条件，按以下 JSON 格式返回：
[
  { "scenario": "边界场景描述", "handling": "建议的处理方式", "severity": "critical/warning/info" }
]

只返回 JSON 数组，不要其他内容。最多返回 5 个建议。`,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    maxTokens: 1500,
    responseSchema: EdgeCasesSchema,
    isDefault: true
  },
  'generate-tests': {
    key: 'generate-tests',
    version: 1,
    variant: 'default',
    description: '生成测试用例',
    systemPrompt: '你是一个测试用例设计专家。请严格按用户要求的 JSON 格式返回测试用例。',
    userPromptTemplate: `请为以下业务逻辑生成测试用例。

节点名称：{{nodeName}}
触发条件：{{trigger}}
前置依赖：{{dependsOn}}
主流程：{{mainFlow}}
分支条件：{{branches}}
边界条件：{{edgeCases}}

请按以下 JSON 格式返回测试用例：
{
  "normalCases": [{ "name": "正常流程测试", "steps": ["步骤1"], "expected": "预期结果" }],
  "edgeCases": [{ "name": "边界条件测试", "steps": ["步骤1"], "expected": "预期结果" }],
  "branchCases": [{ "name": "分支测试", "condition": "分支条件", "steps": ["步骤1"], "expected": "预期结果" }]
}

只返回 JSON，不要其他内容。每类最多 3 个测试用例。`,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    maxTokens: 2500,
    responseSchema: TestCasesSchema,
    isDefault: true
  },
  'nl-query': {
    key: 'nl-query',
    version: 1,
    variant: 'default',
    description: '自然语言查询图谱',
    systemPrompt: '你是一个熟悉业务逻辑图谱的助手。请根据提供的节点信息回答问题，并列出引用的节点ID。',
    userPromptTemplate: `用户问题：{{question}}

以下是图谱中相关的节点信息：

{{context}}

请按以下 JSON 格式返回答案：
{
  "answer": "用中文回答用户的问题，简洁明了",
  "sourceNodeIds": ["节点ID1", "节点ID2"]
}

只返回 JSON，不要其他内容。sourceNodeIds 必须来自上面提供的节点ID。`,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    maxTokens: 1500,
    responseSchema: z.object({
      answer: z.string(),
      sourceNodeIds: z.array(z.string()).min(1)
    }),
    isDefault: true
  },
  'ai-impact-analysis': {
    key: 'ai-impact-analysis',
    version: 1,
    variant: 'default',
    description: 'AI 辅助影响分析',
    systemPrompt: '你是一个业务逻辑影响分析专家。请基于图谱结构影响结果，识别语义上可能遗漏的受影响节点，并给出风险等级。',
    userPromptTemplate: `请分析以下节点变更可能带来的额外影响。

变更节点：
名称：{{node.name}}
概述：{{node.summary}}
触发条件：{{node.trigger}}
前置依赖：{{node.dependsOn}}
主流程：{{node.mainFlow}}

已识别的结构影响节点（{{direction}}，最多 {{maxDepth}} 层）：
{{affectedNodes}}

请按以下 JSON 格式返回：
{
  "summary": "一句话总结整体影响",
  "additionalAffectedNodeIds": ["可能遗漏的节点ID"],
  "reasoning": "为什么这些节点可能也被影响",
  "riskLevel": "low | medium | high"
}

只返回 JSON，不要其他内容。additionalAffectedNodeIds 必须是上面 affectedNodes 中存在的 ID。`,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    maxTokens: 1500,
    responseSchema: z.object({
      summary: z.string(),
      additionalAffectedNodeIds: z.array(z.string()),
      reasoning: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high'])
    }),
    isDefault: true
  }
}
