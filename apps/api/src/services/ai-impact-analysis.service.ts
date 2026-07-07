import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { AiPromptService } from './ai-prompt.service.js'
import { ImpactAnalysisService } from './impact-analysis.service.js'
import type { AiAnalyzeImpactInput } from '@logimap/types'

const anthropic = new Anthropic()

const AiImpactSchema = z.object({
  summary: z.string(),
  additionalAffectedNodeIds: z.array(z.string()),
  reasoning: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high'])
})

export class AiImpactAnalysisService {
  private promptService = new AiPromptService()
  private impactService = new ImpactAnalysisService()

  async analyze(input: AiAnalyzeImpactInput) {
    // 1. 获取结构影响范围
    const scope = await this.impactService.analyzeImpact(input.nodeId, input.direction, input.maxDepth)

    // 2. 获取当前节点信息
    const startNode = await prisma.logicNode.findUnique({
      where: { id: input.nodeId },
      select: {
        id: true,
        name: true,
        summary: true,
        trigger: true,
        dependsOn: true,
        mainFlow: true,
        status: true
      }
    })

    if (!startNode) {
      throw new Error('节点不存在')
    }

    // 3. 获取受影响节点详情
    const affectedIds = [...scope.direct, ...scope.indirect, ...scope.thirdLevel].map((n) => n.id)
    const affectedNodes = await prisma.logicNode.findMany({
      where: { id: { in: affectedIds } },
      select: {
        id: true,
        name: true,
        summary: true,
        status: true
      }
    })

    const affectedMap = new Map(affectedNodes.map((n) => [n.id, n]))

    // 4. 用 LLM 做语义层面的补充分析
    const context = {
      node: startNode,
      direction: input.direction,
      maxDepth: input.maxDepth,
      affectedNodes: affectedNodes.map((n) => ({
        id: n.id,
        name: n.name,
        summary: n.summary,
        status: n.status
      }))
    }

    const prompt = await this.promptService.getPrompt('ai-impact-analysis', input.teamId).catch(() => null)

    const systemPrompt =
      prompt?.systemPrompt ??
      '你是一个业务逻辑影响分析专家。请基于图谱结构影响结果，识别语义上可能遗漏的受影响节点，并给出风险等级。'

    const userPromptTemplate =
      prompt?.userPromptTemplate ??
      `请分析以下节点变更可能带来的额外影响。

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

只返回 JSON，不要其他内容。additionalAffectedNodeIds 必须是上面 affectedNodes 中存在的 ID。`

    const userContent = this.promptService.renderTemplate(userPromptTemplate, {
      nodeName: startNode.name,
      nodeSummary: startNode.summary || '无',
      nodeTrigger: startNode.trigger || '无',
      nodeDependsOn: startNode.dependsOn || '无',
      nodeMainFlow: startNode.mainFlow || '无',
      direction: input.direction,
      maxDepth: String(input.maxDepth),
      affectedNodes: JSON.stringify(context.affectedNodes, null, 2)
    })

    const message = await anthropic.messages.create({
      model: prompt?.model ?? 'claude-sonnet-4-20250514',
      max_tokens: prompt?.maxTokens ?? 1500,
      temperature: prompt?.temperature ?? 0.2,
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } => block.type === 'text')
    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    const parsed = this.promptService.parseJsonResponse(textBlock.text, AiImpactSchema)

    // 过滤有效的 additionalAffectedNodeIds
    const validIds = new Set(affectedIds)
    const additionalIds = parsed.additionalAffectedNodeIds.filter((id) => validIds.has(id))

    return {
      structural: scope,
      ai: {
        summary: parsed.summary,
        reasoning: parsed.reasoning,
        riskLevel: parsed.riskLevel,
        additionalAffectedNodeIds: additionalIds,
        additionalAffectedNodes: additionalIds
          .map((id) => affectedMap.get(id))
          .filter(Boolean)
      }
    }
  }
}
