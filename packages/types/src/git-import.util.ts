import type { SuggestedSystem, SuggestedModule } from './git-import.schemas.js'

/** 从仓库地址解析出托管商/owner/repo */
export interface ParsedRepo {
  provider: 'github' | 'gitlab'
  owner: string
  repo: string
  host: string
}

export function parseRepoUrl(repoUrl: string): ParsedRepo {
  const cleaned = repoUrl.trim().replace(/\.git$/i, '').replace(/\/+$/, '')
  let url: URL
  try {
    url = new URL(cleaned)
  } catch {
    throw new Error('仓库地址格式不正确')
  }
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length < 2) {
    throw new Error('无法从地址解析出 owner/repo')
  }
  const provider: 'github' | 'gitlab' = url.hostname.includes('gitlab') ? 'gitlab' : 'github'
  // GitLab 子群组：取最后两段作为 group/project 的近似（owner 为前缀合并）
  const repo = segments[segments.length - 1]
  const owner = segments.slice(0, segments.length - 1).join('/')
  return { provider, owner, repo, host: url.hostname }
}

/** 用于生成 slug */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'item'
}

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  '.gitlab',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  '.next',
  '.turbo',
  '.vscode',
  '.idea',
  'test',
  'tests',
  '__tests__',
  '__mocks__',
  'e2e',
  'public',
  'assets',
  'static',
  'docs',
  'doc',
  'examples',
  'example',
  'scripts',
  'bin',
  'config',
  '.husky'
])

const MONOREPO_ROOTS = ['apps', 'packages', 'services', 'libs']
const SOURCE_ROOTS = ['src', 'lib', 'app', 'source', 'internal', 'pkg']

function isIgnored(segment: string): boolean {
  return IGNORE_DIRS.has(segment) || segment.startsWith('.')
}

/** 从文件路径列表构建目录集合（含所有中间目录） */
function collectDirs(paths: string[]): Set<string> {
  const dirs = new Set<string>()
  for (const p of paths) {
    const parts = p.split('/').filter(Boolean)
    // 去掉文件名，仅保留目录部分
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'))
    }
  }
  return dirs
}

/** 返回给定父目录下的直接子目录名（去噪） */
function childDirs(dirs: Set<string>, parent: string): string[] {
  const prefix = parent ? `${parent}/` : ''
  const depth = parent ? parent.split('/').length : 0
  const result = new Set<string>()
  for (const d of dirs) {
    if (parent && !d.startsWith(prefix)) continue
    const parts = d.split('/')
    if (parts.length !== depth + 1) continue
    const name = parts[parts.length - 1]
    if (isIgnored(name)) continue
    result.add(name)
  }
  return [...result].sort()
}

function join(base: string, seg: string): string {
  return base ? `${base}/${seg}` : seg
}

function toModules(dirs: Set<string>, systemPath: string): SuggestedModule[] {
  // 优先取 systemPath 下的 source root 的子目录作为模块
  for (const src of SOURCE_ROOTS) {
    const srcPath = join(systemPath, src)
    if (dirs.has(srcPath)) {
      const mods = childDirs(dirs, srcPath)
      if (mods.length > 0) {
        return mods.map((m) => ({ name: m, slug: slugify(m), path: `${srcPath}/${m}` }))
      }
    }
  }
  // 否则取 systemPath 的直接子目录
  return childDirs(dirs, systemPath).map((m) => ({ name: m, slug: slugify(m), path: join(systemPath, m) }))
}

/**
 * 根据仓库文件路径列表推断系统/模块结构。
 * - monorepo（存在 apps/packages/services/libs）：其直接子目录为系统，系统内源码子目录为模块
 * - 普通仓库：整个仓库为一个系统，源码根（src/lib/...）的子目录为模块
 */
export function buildSuggestions(paths: string[], repoName: string): SuggestedSystem[] {
  const dirs = collectDirs(paths)
  const systems: SuggestedSystem[] = []

  const monorepoSystems: SuggestedSystem[] = []
  for (const root of MONOREPO_ROOTS) {
    if (!dirs.has(root)) continue
    for (const child of childDirs(dirs, root)) {
      const path = `${root}/${child}`
      monorepoSystems.push({
        name: child,
        slug: slugify(child),
        path,
        modules: toModules(dirs, path)
      })
    }
  }

  if (monorepoSystems.length > 0) {
    return dedupeSlugs(monorepoSystems)
  }

  // 普通仓库：单系统
  const modules = toModules(dirs, '')
  systems.push({
    name: repoName,
    slug: slugify(repoName),
    path: '',
    modules
  })
  return dedupeSlugs(systems)
}

/** 保证同级 slug 唯一 */
function dedupeSlugs(systems: SuggestedSystem[]): SuggestedSystem[] {
  const seen = new Map<string, number>()
  return systems.map((s) => {
    let slug = s.slug
    const n = seen.get(slug) ?? 0
    if (n > 0) slug = `${slug}-${n + 1}`
    seen.set(s.slug, n + 1)

    const modSeen = new Map<string, number>()
    const modules = s.modules.map((m) => {
      let ms = m.slug
      const mn = modSeen.get(ms) ?? 0
      if (mn > 0) ms = `${ms}-${mn + 1}`
      modSeen.set(m.slug, mn + 1)
      return { ...m, slug: ms }
    })
    return { ...s, slug, modules }
  })
}
