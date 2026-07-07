import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { AiPromptService } from './ai-prompt.service.js'
import type { BatchGenerateInput, BatchGenerateResult } from '@logimap/types'

const ResultSchema = z.object({
  systems: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      modules: z.array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          nodes: z.array(
            z.object({
              name: z.string(),
              summary: z.string().optional(),
              trigger: z.string().optional(),
              mainFlow: z.string().optional()
            })
          ).optional()
        })
      ).optional()
    })
  )
})

export class BatchGenerationService {
  private promptService = new AiPromptService()
  private anthropic = new Anthropic()

  async generate(input: BatchGenerateInput): Promise<BatchGenerateResult> {
    const prompt = await this.promptService.getPrompt('batch-generate', input.teamId).catch(() => null)

    const systemPrompt =
      prompt?.systemPrompt ??
      '你是一个业务架构师。请根据需求描述，建议合理的系统、模块和逻辑节点树。只返回 JSON，不要其他内容。'

    const userPromptTemplate =
      prompt?.userPromptTemplate ??
      `请根据以下需求，建议一个系统/模块/逻辑节点的层级结构。

需求描述：
{{requirements}}

额外上下文：
{{context}}

请按以下 JSON 格式返回建议（仅建议，不要真实创建）：
{
  "systems": [
    {
      "name": "系统名称",
      "description": "系统描述",
      "modules": [
        {
          "name": "模块名称",
          "description": "模块描述",
          "nodes": [
            { "name": "节点名称", "summary": "一句话概述", "trigger": "触发条件", "mainFlow": "主流程" }
          ]
        }
      ]
    }
  ]
}

只返回 JSON，不要其他内容。`

    const userContent = this.promptService.renderTemplate(userPromptTemplate, {
      requirements: input.requirements,
      context: input.context || '无'
    })

    const message = await this.anthropic.messages.create({
      model: prompt?.model ?? 'claude-sonnet-4-20250514',
      max_tokens: prompt?.maxTokens ?? 4000,
      temperature: prompt?.temperature ?? 0.3,
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } => block.type === 'text')
    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    return this.promptService.parseJsonResponse(textBlock.text, prompt?.responseSchema ?? ResultSchema) as BatchGenerateResult
  }
}
