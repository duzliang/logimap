import { describe, it, expect } from 'vitest'
import { parseRepoUrl, slugify, buildSuggestions } from '@logimap/types'

describe('parseRepoUrl', () => {
  it('解析 GitHub 地址', () => {
    expect(parseRepoUrl('https://github.com/acme/repo.git')).toMatchObject({
      provider: 'github',
      owner: 'acme',
      repo: 'repo'
    })
  })
  it('解析 GitLab 地址（含末尾斜杠）', () => {
    expect(parseRepoUrl('https://gitlab.com/acme/repo/')).toMatchObject({
      provider: 'gitlab',
      owner: 'acme',
      repo: 'repo'
    })
  })
  it('非法地址抛错', () => {
    expect(() => parseRepoUrl('not-a-url')).toThrow()
  })
})

describe('slugify', () => {
  it('转小写连字符', () => {
    expect(slugify('User Service')).toBe('user-service')
    expect(slugify('@logimap/UI')).toBe('logimap-ui')
  })
})

describe('buildSuggestions', () => {
  it('monorepo：apps/packages 子目录为系统', () => {
    const paths = [
      'apps/web/src/main.tsx',
      'apps/web/src/pages/home.tsx',
      'apps/api/src/index.ts',
      'apps/api/src/routes/auth.ts',
      'packages/ui/src/button.tsx',
      'node_modules/x/index.js',
      'README.md'
    ]
    const systems = buildSuggestions(paths, 'my-repo')
    const names = systems.map((s) => s.name).sort()
    expect(names).toEqual(['api', 'ui', 'web'])
    const web = systems.find((s) => s.name === 'web')!
    expect(web.path).toBe('apps/web')
    expect(web.modules.map((m) => m.name).sort()).toEqual(['pages'])
  })

  it('普通仓库：单系统，src 子目录为模块', () => {
    const paths = [
      'src/invoices/create.ts',
      'src/invoices/list.ts',
      'src/users/index.ts',
      'src/index.ts',
      'test/foo.test.ts',
      'package.json'
    ]
    const systems = buildSuggestions(paths, 'billing')
    expect(systems).toHaveLength(1)
    expect(systems[0].name).toBe('billing')
    expect(systems[0].slug).toBe('billing')
    expect(systems[0].modules.map((m) => m.name).sort()).toEqual(['invoices', 'users'])
  })

  it('忽略噪声目录', () => {
    const paths = ['src/core/a.ts', 'dist/bundle.js', 'coverage/lcov.info', 'node_modules/y/z.js']
    const systems = buildSuggestions(paths, 'r')
    expect(systems[0].modules.map((m) => m.name)).toEqual(['core'])
  })

  it('无子目录时系统模块为空', () => {
    const systems = buildSuggestions(['index.ts', 'README.md'], 'flat')
    expect(systems).toHaveLength(1)
    expect(systems[0].modules).toEqual([])
  })
})
