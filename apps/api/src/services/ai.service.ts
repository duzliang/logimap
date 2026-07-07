import Anthropic from '@anthropic-ai/sdk'
import { AiPromptService } from './ai-prompt.service.js'
import type { GenerateNodeInput, AnalyzeNodeInput, SuggestEdgeCasesInput } from '@logimap/types'

const anthropic = new Anthropic()

interface GeneratedNodeContent {
  trigger: string
  dependsOn: string
  mainFlow: string
  branches: Array<{ condition: string; action: string }>
  edgeCases: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
}

interface NodeAnalysis {
  completeness: number
  suggestions: string[]
  missingEdgeCases: string[]
  recommendedBranches: string[]
}

export class AIService {
  private promptService = new AiPromptService()

  private async callAI(key: string, variables: Record<string, unknown>, teamId?: string | null) {
    const prompt = await this.promptService.getPrompt(key, teamId)

    const userContent = this.promptService.renderTemplate(prompt.userPromptTemplate, variables)

    const messages: Anthropic.MessageParam[] = []

    if (prompt.systemPrompt) {
      messages.push({ role: 'assistant', content: prompt.systemPrompt })
    }

    messages.push({ role: 'user', content: userContent })

    const message = await anthropic.messages.create({
      model: prompt.model,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature,
      messages
    })

    const textBlock = message.content.find((block): block is { type: 'text'; text: string } =>
      block.type === 'text'
    )

    if (!textBlock) {
      throw new Error('AI 响应格式错误')
    }

    return this.promptService.parseJsonResponse(textBlock.text, prompt.responseSchema)
  }

  async generateNodeContent(input: GenerateNodeInput, teamId?: string | null): Promise<GeneratedNodeContent> {
    return this.callAI(
      'generate-node',
      {
        nodeName: input.nodeName,
        moduleContext: input.moduleContext || '无',
        existingContent: input.existingContent
          ? JSON.stringify({
              trigger: input.existingContent.trigger || '无',
              dependsOn: input.existingContent.dependsOn || '无',
              mainFlow: input.existingContent.mainFlow || '无'
            })
          : '无'
      },
      teamId
    ) as Promise<GeneratedNodeContent>
  }

  async analyzeNode(input: AnalyzeNodeInput, teamId?: string | null): Promise<NodeAnalysis> {
    return this.callAI(
      'analyze-node',
      {
        nodeName: input.nodeName,
        trigger: input.trigger || '未填写',
        dependsOn: input.dependsOn || '未填写',
        mainFlow: input.mainFlow || '未填写',
        branches: JSON.stringify(input.branches || []),
        edgeCases: JSON.stringify(input.edgeCases || [])
      },
      teamId
    ) as Promise<NodeAnalysis>
  }

  async suggestEdgeCases(input: SuggestEdgeCasesInput, teamId?: string | null): Promise<GeneratedNodeContent['edgeCases']> {
    return this.callAI(
      'suggest-edge-cases',
      {
        nodeName: input.nodeName,
        mainFlow: input.mainFlow,
        existingEdgeCases: JSON.stringify(input.existingEdgeCases || [])
      },
      teamId
    ) as Promise<GeneratedNodeContent['edgeCases']>
  }

  async generateTestCases(input: AnalyzeNodeInput, teamId?: string | null): Promise<{
    normalCases: Array<{ name: string; steps: string[]; expected: string }>
    edgeCases: Array<{ name: string; steps: string[]; expected: string }>
    branchCases: Array<{ name: string; condition: string; steps: string[]; expected: string }>
  }> {
    return this.callAI(
      'generate-tests',
      {
        nodeName: input.nodeName,
        trigger: input.trigger || '未填写',
        dependsOn: input.dependsOn || '未填写',
        mainFlow: input.mainFlow || '未填写',
        branches: JSON.stringify(input.branches || []),
        edgeCases: JSON.stringify(input.edgeCases || [])
      },
      teamId
    ) as ReturnType<typeof this.generateTestCases>
  }
}
