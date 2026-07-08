import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { AiPromptService } from './ai-prompt.service.js'
import { parseCodeRef, buildCodeRefUrl } from '@logimap/types'
import type { CheckConsistencyInput, ConsistencyResult } from '@logimap/types'

const ResultSchema = z.object({
  consistent: z.boolean(),
  score: z.number().min(0).max(100),
  reason: z.string(),
  suggestions: z.array(z.string())
})

export class CodeConsistencyService {
  private promptService = new AiPromptService()
  private anthropic = new Anthropic()

  async check(input: CheckConsistencyInput): Promise<ConsistencyResult> {
    const node = await prisma.logicNode.findUnique({
      where: { id: input.nodeId },
      select: {
        name: true,
        summary: true,
        trigger: true,
        dependsOn: true,
        mainFlow: true,
        codeRef: true,
        module: {
          select: {
            system: { select: { repoUrl: true, repoBranch: true } }
          }
        }
      }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    if (!node.codeRef) {
      throw new Error('该节点未填写代码关联')
    }

    const parsed = parseCodeRef(node.codeRef)
    const repo = node.module.system
    const resolvedUrl = buildCodeRefUrl(parsed, repo)
    const lineRange = parsed.lineStart
      ? parsed.lineEnd && parsed.lineEnd !== parsed.lineStart
        ? `${parsed.lineStart}-${parsed.lineEnd}`
        : String(parsed.lineStart)
      : ''

    const prompt = await this.promptService.getPrompt('check-consistency', input.teamId).catch(() => null)

    const systemPrompt =
      prompt?.systemPrompt ??
      '你是一个代码与业务逻辑一致性审查专家。请根据逻辑节点描述和其关联的代码引用，判断二者是否语义一致。只返回 JSON，不要其他内容。'

    const userPromptTemplate =
      prompt?.userPromptTemplate ??
      `请判断以下逻辑节点描述与其代码引用是否语义一致。

节点名称：{{nodeName}}
节点概述：{{nodeSummary}}
触发条件：{{nodeTrigger}}
前置依赖：{{nodeDependsOn}}
主流程：{{nodeMainFlow}}
代码引用：{{codeRef}}
解析后的文件路径：{{filePath}}
解析后的函数/类名：{{symbol}}
解析后的行号范围：{{lineRange}}
代码永久链接：{{resolvedUrl}}

请按以下 JSON 格式返回：
{
  "consistent": true or false,
  "score": 0-100 的一致性分数,
  "reason": "判断理由",
  "suggestions": ["改进建议1"]
}

只返回 JSON，不要其他内容。`

    const userContent = this.promptService.renderTemplate(userPromptTemplate, {
      nodeName: node.name,
      nodeSummary: node.summary || '无',
      nodeTrigger: node.trigger || '无',
      nodeDependsOn: node.dependsOn || '无',
      nodeMainFlow: node.mainFlow || '无',
      codeRef: node.codeRef,
      filePath: parsed.filePath,
      symbol: parsed.symbol || '无',
      lineRange: lineRange || '无',
      resolvedUrl: resolvedUrl || '无'
    })

    const message = await this.anthropic.messages.create({
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

    return this.promptService.parseJsonResponse(textBlock.text, prompt?.responseSchema ?? ResultSchema) as ConsistencyResult
  }
}
