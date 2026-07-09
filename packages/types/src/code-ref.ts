/**
 * codeRef 解析层（T3-7）
 *
 * codeRef 是逻辑节点上的自由文本代码关联，支持三种形态：
 *  - url：完整 http(s) 链接（通常是 GitHub/GitLab 永久链接），原样跳转
 *  - relative：仓库内相对路径（可带符号或行号），结合 System 的 repoUrl/branch 构造永久链接
 *  - bare：无法定位到文件的裸字符串（如仅函数名），不可跳转
 *
 * 支持的相对形态示例：
 *  - src/services/settlement.ts#calculateSettlement   （文件 + 符号）
 *  - src/services/settlement.ts:120-140               （文件 + 行号区间）
 *  - src/services/settlement.ts#L120-L140             （文件 + 行号锚点）
 *  - src/services/settlement.ts#L120                  （文件 + 单行）
 */

export type GitProvider = 'github' | 'gitlab' | 'unknown'

export type CodeRefKind = 'url' | 'relative' | 'bare'

export interface ParsedCodeRef {
  kind: CodeRefKind
  /** 相对文件路径（url 形态下为反解出的路径，可能为空） */
  filePath: string
  /** 关联的函数/类名（如有） */
  symbol: string
  /** 起始行号（如有） */
  lineStart?: number
  /** 结束行号（如有） */
  lineEnd?: number
  /** url 形态下的原始链接 */
  rawUrl?: string
}

export interface RepoConfig {
  repoUrl?: string | null
  repoBranch?: string | null
}

/** 从仓库地址判断代码托管平台 */
export function detectGitProvider(repoUrl?: string | null): GitProvider {
  if (!repoUrl) return 'unknown'
  const lower = repoUrl.toLowerCase()
  if (lower.includes('github.com')) return 'github'
  if (lower.includes('gitlab')) return 'gitlab'
  return 'unknown'
}

/** 解析尾部的行号锚点，返回行号与去掉锚点后的剩余字符串 */
function extractLines(input: string): { rest: string; lineStart?: number; lineEnd?: number } {
  // #L120-L140 / #L120 / #L120-140
  const hashMatch = input.match(/#L(\d+)(?:-L?(\d+))?$/)
  if (hashMatch) {
    return {
      rest: input.slice(0, hashMatch.index),
      lineStart: Number(hashMatch[1]),
      lineEnd: hashMatch[2] ? Number(hashMatch[2]) : undefined,
    }
  }
  // :120-140 / :120
  const colonMatch = input.match(/:(\d+)(?:-(\d+))?$/)
  if (colonMatch) {
    return {
      rest: input.slice(0, colonMatch.index),
      lineStart: Number(colonMatch[1]),
      lineEnd: colonMatch[2] ? Number(colonMatch[2]) : undefined,
    }
  }
  return { rest: input }
}

/** 反解 GitHub/GitLab blob 永久链接，尽力提取文件路径与行号 */
function parseBlobUrl(url: string): { filePath: string; lineStart?: number; lineEnd?: number } {
  let filePath = ''
  // GitHub: /blob/<branch>/<path>   GitLab: /-/blob/<branch>/<path>
  const blobMatch = url.match(/\/(?:-\/)?blob\/[^/]+\/([^#?]+)/)
  if (blobMatch) {
    try {
      filePath = decodeURIComponent(blobMatch[1])
    } catch {
      filePath = blobMatch[1]
    }
  }
  const { lineStart, lineEnd } = extractLines(url)
  return { filePath, lineStart, lineEnd }
}

/** 解析 codeRef 字符串 */
export function parseCodeRef(codeRef: string): ParsedCodeRef {
  const raw = (codeRef ?? '').trim()

  if (/^https?:\/\//i.test(raw)) {
    const { filePath, lineStart, lineEnd } = parseBlobUrl(raw)
    return { kind: 'url', filePath, symbol: '', lineStart, lineEnd, rawUrl: raw }
  }

  const { rest, lineStart, lineEnd } = extractLines(raw)

  // 剩余部分按 '#' 拆分出符号（行号已在上一步剥离）
  const hashIndex = rest.indexOf('#')
  const filePath = (hashIndex >= 0 ? rest.slice(0, hashIndex) : rest).trim()
  const symbol = hashIndex >= 0 ? rest.slice(hashIndex + 1).trim() : ''

  // 既没有路径分隔符也没有扩展名 → 视为裸符号，不可定位文件
  const looksLikePath = filePath.includes('/') || /\.[a-z0-9]+$/i.test(filePath)
  const kind: CodeRefKind = looksLikePath ? 'relative' : 'bare'

  return { kind, filePath: filePath || raw, symbol, lineStart, lineEnd }
}

function lineAnchor(provider: GitProvider, lineStart?: number, lineEnd?: number): string {
  if (!lineStart) return ''
  if (!lineEnd || lineEnd === lineStart) return `#L${lineStart}`
  // GitHub 用 #L10-L20，GitLab 用 #L10-20
  return provider === 'gitlab' ? `#L${lineStart}-${lineEnd}` : `#L${lineStart}-L${lineEnd}`
}

function normalizeRepoUrl(repoUrl: string): string {
  return repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/i, '').replace(/\/+$/, '')
}

/**
 * 根据解析结果与仓库配置构造可跳转的永久链接。
 * 无法构造时返回 null（裸符号、未知平台、缺少 repoUrl 等）。
 */
export function buildCodeRefUrl(parsed: ParsedCodeRef, repo: RepoConfig): string | null {
  if (parsed.kind === 'url') return parsed.rawUrl ?? null
  if (parsed.kind !== 'relative') return null
  if (!repo.repoUrl) return null

  const provider = detectGitProvider(repo.repoUrl)
  if (provider === 'unknown') return null

  const base = normalizeRepoUrl(repo.repoUrl)
  const branch = (repo.repoBranch || '').trim() || 'main'
  const path = parsed.filePath.replace(/^\.?\//, '')
  const anchor = lineAnchor(provider, parsed.lineStart, parsed.lineEnd)

  if (provider === 'gitlab') {
    return `${base}/-/blob/${branch}/${path}${anchor}`
  }
  return `${base}/blob/${branch}/${path}${anchor}`
}

/** 便捷方法：直接从 codeRef + 仓库配置得到链接 */
export function resolveCodeRefUrl(codeRef: string, repo: RepoConfig): string | null {
  if (!codeRef?.trim()) return null
  return buildCodeRefUrl(parseCodeRef(codeRef), repo)
}

/** 归一化文件路径：去掉前导 ./ 与 /，反斜杠转正斜杠，去掉查询参数 */
export function normalizeCodePath(path: string): string {
  return (path ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/[?#].*$/, '')
    .replace(/^\.?\/+/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

/**
 * 判断两个文件路径是否指向同一文件（反向关联匹配用）。
 * 采用「路径尾部段匹配」：任一方是另一方的尾部子路径即视为命中，
 * 以容忍 codeRef 存的是仓库相对路径、而查询方给的是更长的绝对路径（反之亦然）。
 */
export function isSameCodeFile(a: string, b: string): boolean {
  const na = normalizeCodePath(a)
  const nb = normalizeCodePath(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const sa = na.split('/')
  const sb = nb.split('/')
  const shorter = sa.length <= sb.length ? sa : sb
  const longer = sa.length <= sb.length ? sb : sa
  // shorter 必须是 longer 的尾部连续段
  const tail = longer.slice(longer.length - shorter.length)
  return tail.every((seg, i) => seg === shorter[i])
}

export interface CodePathMatchQuery {
  /** 目标文件路径（相对或绝对均可） */
  filePath: string
  /** 可选行号，用于按行号区间进一步过滤 */
  line?: number
}

export interface CodePathMatchResult {
  matched: boolean
  /** 命中的解析结果（便于调用方展示行号/符号） */
  parsed: ParsedCodeRef
  /** 是否命中到了行号级别（query 带行号且落在节点区间内） */
  lineMatched: boolean
}

/**
 * 反向关联核心匹配器（T3-9）：给定节点的 codeRef 与目标代码位置，
 * 判断该节点是否引用了目标文件（可选按行号收敛）。
 *
 * - 裸符号（无法定位文件）永不匹配。
 * - 文件路径按 isSameCodeFile 尾部段匹配。
 * - 若 query 带行号且节点声明了行号区间，则要求行号落在区间内；
 *   节点未声明行号区间时视为覆盖整文件，行号不参与过滤。
 */
export function matchesCodePath(codeRef: string, query: CodePathMatchQuery): CodePathMatchResult {
  const parsed = parseCodeRef(codeRef ?? '')
  const empty: CodePathMatchResult = { matched: false, parsed, lineMatched: false }

  if (parsed.kind === 'bare') return empty
  if (!parsed.filePath) return empty
  if (!isSameCodeFile(parsed.filePath, query.filePath)) return empty

  // 文件已命中，处理行号收敛
  if (query.line == null || parsed.lineStart == null) {
    return { matched: true, parsed, lineMatched: false }
  }

  const start = parsed.lineStart
  const end = parsed.lineEnd ?? parsed.lineStart
  const withinRange = query.line >= start && query.line <= end
  return withinRange
    ? { matched: true, parsed, lineMatched: true }
    : empty
}
