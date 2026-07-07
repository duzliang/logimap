import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { AiPromptService } from './ai-prompt.service.js'
import type { NaturalLanguageQueryInput } from '@logimap/types'

const anthropic = new Anthropic()

const NlQueryAnswerSchema = z.object({
  answer: z.string(),
  sourceNodeIds: z.array(z.string()).min(1)
})

export class NlQueryService {
  private promptService = new AiPromptService()

  async answer(input: NaturalLanguageQueryInput) {
    // 1. 关键词召回：从问题中提取简单关键词（取前 3 个长度 > 1 的词）
    const keywords = this.extractKeywords(input.question)

    // 2. 查询团队/系统/模块下的节点
    const nodes = await prisma.logicNode.findMany({
      where: {
        module: {
          system: {
            teamId: input.teamId,
            ...(input.systemId && { id: input.systemId })
          },
          ...(input.moduleId && { id: input.moduleId })
        },
        ...(keywords.length > 0 && {
          OR: keywords.flatMap((keyword) => [
            { name: { contains: keyword, mode: 'insensitive' } },
            { summary: { contains: keyword, mode: 'insensitive' } },
            { mainFlow: { contains: keyword, mode: 'insensitive' } },
            { trigger: { contains: keyword, mode: 'insensitive' } }
          ])
        })
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        summary: true,
        status: true,
        trigger: true,
        dependsOn: true,
        mainFlow: true,
        moduleId: true,
        module: {
          select: { name: true, systemId: true }
        }
      }
    })

    if (nodes.length === 0) {
      return {
        answer: '未找到与问题相关的节点，请尝试使用更通用的关键词。',
        sourceNodeIds: [] as string[]
      }
    }

    // 3. 用 LLM 基于召回的节点回答问题
    const context = nodes
      .map(
        (node) =>
          `节点ID: ${node.id}
名称: ${node.name}
概述: ${node.summary || '无'}
触发条件: ${node.trigger || '无'}
前置依赖: ${node.dependsOn || '无'}
主流程: ${node.mainFlow || '无'}`
      )
      .join('\n\n---\n\n')

    const prompt = await this.promptService.getPrompt('nl-query', input.teamId).catch(() => null)

    const systemPrompt = prompt?.systemPrompt ?? '你是一个熟悉业务逻辑图谱的助手。请根据提供的节点信息回答问题，并列出引用的节点ID。'
    const userPromptTemplate =
      prompt?.userPromptTemplate ??
      `用户问题：{{question}}

以下是图谱中相关的节点信息：

{{context}}

请按以下 JSON 格式返回答案：
{
  "answer": "用中文回答用户的问题，简洁明了",
  "sourceNodeIds": ["节点ID1", "节点ID2"]
}

只返回 JSON，不要其他内容。sourceNodeIds 必须来自上面提供的节点ID。`

    const userContent = this.promptService.renderTemplate(userPromptTemplate, {
      question: input.question,
      context
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

    const parsed = this.promptService.parseJsonResponse(textBlock.text, NlQueryAnswerSchema)

    // 过滤掉不存在的 sourceNodeIds
    const validNodeIds = new Set(nodes.map((n) => n.id))
    const sourceNodeIds = parsed.sourceNodeIds.filter((id) => validNodeIds.has(id))

    return {
      answer: parsed.answer,
      sourceNodeIds: sourceNodeIds.length > 0 ? sourceNodeIds : [nodes[0].id],
      sources: nodes.filter((n) => sourceNodeIds.includes(n.id))
    }
  }

  private extractKeywords(question: string): string[] {
    // 简单中文/英文分词：去除标点，按空格或常见停用词拆分
    const stopWords = new Set([
      '的',
      '了',
      '是',
      '在',
      '和',
      '与',
      '或',
      '有',
      '哪些',
      '什么',
      '怎么',
      '如何',
      '请',
      '问',
      '一下',
      '给我',
      '列出',
      '告诉我'
    ])

    return question
      .replace(/[，。？！、；：""''（）【】\[\]{}]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !stopWords.has(w))
      .slice(0, 5)
  }
}
