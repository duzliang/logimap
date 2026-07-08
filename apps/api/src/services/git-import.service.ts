import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import { parseRepoUrl, buildSuggestions, slugify } from '@logimap/types'
import type { AnalyzeRepoResult, ApplyImportInput, SuggestedSystem } from '@logimap/types'

const MAX_FILES = 20000

interface TreeEntry {
  path: string
  type: string
}

export class GitImportService {
  /** 分析仓库目录结构，返回系统/模块建议 */
  async analyze(repoUrl: string, branch?: string): Promise<AnalyzeRepoResult> {
    const parsed = parseRepoUrl(repoUrl)
    const { provider, owner, repo } = parsed

    const { paths, resolvedBranch } =
      provider === 'gitlab'
        ? await this.fetchGitlabTree(owner, repo, branch)
        : await this.fetchGithubTree(owner, repo, branch)

    const systems = buildSuggestions(paths, repo)

    return {
      provider,
      owner,
      repo,
      branch: resolvedBranch,
      fileCount: paths.length,
      systems
    }
  }

  /** 按建议创建系统与模块，返回创建结果 */
  async apply(teamId: string, input: ApplyImportInput) {
    const createdSystems: Array<{ id: string; name: string; slug: string; modulesCreated: number }> = []

    for (const sys of input.systems) {
      const slug = await this.uniqueSystemSlug(teamId, sys.slug)
      const system = await prisma.system.create({
        data: {
          id: generateId(),
          teamId,
          name: sys.name,
          slug,
          description: `从 ${input.repoUrl} 导入（${sys.path || '根目录'}）`,
          repoUrl: input.repoUrl,
          repoBranch: input.branch || 'main'
        }
      })

      let order = 0
      let modulesCreated = 0
      for (const mod of sys.modules) {
        const modSlug = await this.uniqueModuleSlug(system.id, mod.slug)
        await prisma.module.create({
          data: {
            id: generateId(),
            systemId: system.id,
            name: mod.name,
            slug: modSlug,
            description: mod.path,
            order: order++
          }
        })
        modulesCreated++
      }

      createdSystems.push({ id: system.id, name: system.name, slug: system.slug, modulesCreated })
    }

    return { systems: createdSystems }
  }

  private async uniqueSystemSlug(teamId: string, base: string): Promise<string> {
    let slug = slugify(base)
    let n = 1
    while (await prisma.system.findFirst({ where: { teamId, slug }, select: { id: true } })) {
      n += 1
      slug = `${slugify(base)}-${n}`
    }
    return slug
  }

  private async uniqueModuleSlug(systemId: string, base: string): Promise<string> {
    let slug = slugify(base)
    let n = 1
    while (await prisma.module.findFirst({ where: { systemId, slug }, select: { id: true } })) {
      n += 1
      slug = `${slugify(base)}-${n}`
    }
    return slug
  }

  private async fetchGithubTree(owner: string, repo: string, branch?: string) {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LogiMap'
    }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

    let resolvedBranch = branch
    if (!resolvedBranch) {
      const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
      if (!metaRes.ok) throw new Error(`无法访问仓库（${metaRes.status}），请确认地址与访问权限`)
      const meta = (await metaRes.json()) as { default_branch?: string }
      resolvedBranch = meta.default_branch || 'main'
    }

    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(resolvedBranch)}?recursive=1`,
      { headers }
    )
    if (!treeRes.ok) throw new Error(`无法读取目录树（${treeRes.status}）`)
    const tree = (await treeRes.json()) as { tree?: TreeEntry[]; truncated?: boolean }
    const paths = (tree.tree || [])
      .filter((e) => e.type === 'blob')
      .map((e) => e.path)
      .slice(0, MAX_FILES)
    return { paths, resolvedBranch }
  }

  private async fetchGitlabTree(owner: string, repo: string, branch?: string) {
    const projectId = encodeURIComponent(`${owner}/${repo}`)
    const headers: Record<string, string> = { 'User-Agent': 'LogiMap' }
    if (process.env.GITLAB_TOKEN) headers['PRIVATE-TOKEN'] = process.env.GITLAB_TOKEN

    let resolvedBranch = branch || 'main'
    const paths: string[] = []
    // GitLab tree API 分页，最多取若干页
    for (let page = 1; page <= 20; page++) {
      const url =
        `https://gitlab.com/api/v4/projects/${projectId}/repository/tree` +
        `?recursive=true&per_page=100&page=${page}&ref=${encodeURIComponent(resolvedBranch)}`
      const res = await fetch(url, { headers })
      if (!res.ok) {
        if (page === 1) throw new Error(`无法访问仓库（${res.status}），请确认地址与访问权限`)
        break
      }
      const entries = (await res.json()) as Array<{ path: string; type: string }>
      for (const e of entries) {
        if (e.type === 'blob') paths.push(e.path)
      }
      if (entries.length < 100) break
    }
    return { paths: paths.slice(0, MAX_FILES), resolvedBranch }
  }
}

export type { SuggestedSystem }
