import { describe, it, expect } from 'vitest'
import {
  parseCodeRef,
  buildCodeRefUrl,
  resolveCodeRefUrl,
  detectGitProvider,
  normalizeCodePath,
  isSameCodeFile,
  matchesCodePath,
} from '@logimap/types'

describe('detectGitProvider', () => {
  it('识别 github / gitlab / unknown', () => {
    expect(detectGitProvider('https://github.com/org/repo')).toBe('github')
    expect(detectGitProvider('https://gitlab.com/org/repo')).toBe('gitlab')
    expect(detectGitProvider('https://gitlab.example.com/org/repo')).toBe('gitlab')
    expect(detectGitProvider('https://bitbucket.org/org/repo')).toBe('unknown')
    expect(detectGitProvider(null)).toBe('unknown')
  })
})

describe('parseCodeRef', () => {
  it('解析文件 + 符号', () => {
    const p = parseCodeRef('src/services/settlement.ts#calculateSettlement')
    expect(p.kind).toBe('relative')
    expect(p.filePath).toBe('src/services/settlement.ts')
    expect(p.symbol).toBe('calculateSettlement')
    expect(p.lineStart).toBeUndefined()
  })

  it('解析文件 + 冒号行号区间', () => {
    const p = parseCodeRef('src/services/settlement.ts:120-140')
    expect(p.kind).toBe('relative')
    expect(p.filePath).toBe('src/services/settlement.ts')
    expect(p.lineStart).toBe(120)
    expect(p.lineEnd).toBe(140)
  })

  it('解析文件 + #L 行号锚点', () => {
    const p = parseCodeRef('src/foo.ts#L120-L140')
    expect(p.filePath).toBe('src/foo.ts')
    expect(p.lineStart).toBe(120)
    expect(p.lineEnd).toBe(140)
  })

  it('解析单行 #L 锚点', () => {
    const p = parseCodeRef('src/foo.ts#L88')
    expect(p.lineStart).toBe(88)
    expect(p.lineEnd).toBeUndefined()
  })

  it('裸符号视为 bare', () => {
    const p = parseCodeRef('calculateSettlement')
    expect(p.kind).toBe('bare')
  })

  it('完整 URL 视为 url 并反解路径/行号', () => {
    const p = parseCodeRef('https://github.com/org/repo/blob/main/src/foo.ts#L10-L20')
    expect(p.kind).toBe('url')
    expect(p.rawUrl).toBe('https://github.com/org/repo/blob/main/src/foo.ts#L10-L20')
    expect(p.filePath).toBe('src/foo.ts')
    expect(p.lineStart).toBe(10)
    expect(p.lineEnd).toBe(20)
  })
})

describe('buildCodeRefUrl', () => {
  const github = { repoUrl: 'https://github.com/org/repo', repoBranch: 'develop' }

  it('GitHub 相对路径 + 符号', () => {
    const url = buildCodeRefUrl(parseCodeRef('src/foo.ts#calc'), github)
    expect(url).toBe('https://github.com/org/repo/blob/develop/src/foo.ts')
  })

  it('GitHub 行号区间锚点', () => {
    const url = buildCodeRefUrl(parseCodeRef('src/foo.ts:10-20'), github)
    expect(url).toBe('https://github.com/org/repo/blob/develop/src/foo.ts#L10-L20')
  })

  it('GitLab 使用 /-/blob 与 #L10-20 锚点', () => {
    const url = buildCodeRefUrl(parseCodeRef('src/foo.ts:10-20'), {
      repoUrl: 'https://gitlab.com/org/repo',
      repoBranch: 'main',
    })
    expect(url).toBe('https://gitlab.com/org/repo/-/blob/main/src/foo.ts#L10-20')
  })

  it('缺省分支回退 main，去除 .git 与尾斜杠', () => {
    const url = buildCodeRefUrl(parseCodeRef('src/foo.ts'), {
      repoUrl: 'https://github.com/org/repo.git/',
      repoBranch: '',
    })
    expect(url).toBe('https://github.com/org/repo/blob/main/src/foo.ts')
  })

  it('url 形态直接返回原链接', () => {
    const raw = 'https://github.com/org/repo/blob/main/src/foo.ts#L5'
    expect(buildCodeRefUrl(parseCodeRef(raw), {})).toBe(raw)
  })

  it('裸符号 / 未知平台 / 缺 repoUrl 返回 null', () => {
    expect(buildCodeRefUrl(parseCodeRef('calc'), github)).toBeNull()
    expect(buildCodeRefUrl(parseCodeRef('src/foo.ts'), { repoUrl: 'https://bitbucket.org/o/r' })).toBeNull()
    expect(buildCodeRefUrl(parseCodeRef('src/foo.ts'), {})).toBeNull()
  })
})

describe('resolveCodeRefUrl', () => {
  it('空串返回 null', () => {
    expect(resolveCodeRefUrl('', { repoUrl: 'https://github.com/o/r' })).toBeNull()
  })
  it('端到端解析', () => {
    expect(
      resolveCodeRefUrl('src/a.ts#L3', { repoUrl: 'https://github.com/o/r', repoBranch: 'main' })
    ).toBe('https://github.com/o/r/blob/main/src/a.ts#L3')
  })
})

describe('normalizeCodePath', () => {
  it('去掉前导 ./ 与 /、反斜杠转正斜杠、小写', () => {
    expect(normalizeCodePath('./src/A.ts')).toBe('src/a.ts')
    expect(normalizeCodePath('/src/a.ts')).toBe('src/a.ts')
    expect(normalizeCodePath('src\\a.ts')).toBe('src/a.ts')
    expect(normalizeCodePath('src/a.ts?ref=x#L3')).toBe('src/a.ts')
  })
})

describe('isSameCodeFile', () => {
  it('完全相等或尾部段匹配', () => {
    expect(isSameCodeFile('src/a.ts', 'src/a.ts')).toBe(true)
    expect(isSameCodeFile('services/settlement.ts', '/repo/src/services/settlement.ts')).toBe(true)
    expect(isSameCodeFile('src/services/settlement.ts', 'settlement.ts')).toBe(true)
  })
  it('不同文件不匹配', () => {
    expect(isSameCodeFile('src/a.ts', 'src/b.ts')).toBe(false)
    expect(isSameCodeFile('foo/a.ts', 'bar/a.ts')).toBe(false) // 等长必须全等
    expect(isSameCodeFile('src/x/a.ts', 'src/y/a.ts')).toBe(false) // 段数相同但不全等
    expect(isSameCodeFile('', 'a.ts')).toBe(false)
    // 纯文件名（1 段）能匹配任意以其结尾的路径
    expect(isSameCodeFile('a.ts', 'foo/a.ts')).toBe(true)
  })
})

describe('matchesCodePath', () => {
  it('文件命中，无行号约束', () => {
    const r = matchesCodePath('src/services/settlement.ts#calc', { filePath: 'services/settlement.ts' })
    expect(r.matched).toBe(true)
    expect(r.lineMatched).toBe(false)
    expect(r.parsed.symbol).toBe('calc')
  })
  it('裸符号永不匹配', () => {
    expect(matchesCodePath('calculateSettlement', { filePath: 'settlement.ts' }).matched).toBe(false)
  })
  it('行号落在区间内命中，越界不命中', () => {
    const ref = 'src/a.ts#L100-L120'
    expect(matchesCodePath(ref, { filePath: 'src/a.ts', line: 110 }).matched).toBe(true)
    expect(matchesCodePath(ref, { filePath: 'src/a.ts', line: 110 }).lineMatched).toBe(true)
    expect(matchesCodePath(ref, { filePath: 'src/a.ts', line: 200 }).matched).toBe(false)
  })
  it('节点无行号时按整文件覆盖，行号不参与过滤', () => {
    const r = matchesCodePath('src/a.ts', { filePath: 'src/a.ts', line: 999 })
    expect(r.matched).toBe(true)
    expect(r.lineMatched).toBe(false)
  })
})
