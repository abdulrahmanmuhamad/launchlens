import { describe, expect, it } from 'vitest'
import { parseGitHubUrl } from './jobs'

describe('parseGitHubUrl', () => {
  it('extracts an owner and repository', () => {
    expect(parseGitHubUrl('https://github.com/deepdotspace/threadhunt')).toEqual({
      owner: 'deepdotspace',
      repo: 'threadhunt',
    })
  })

  it('normalizes a .git suffix', () => {
    expect(parseGitHubUrl('https://github.com/deepdotspace/threadhunt.git')).toEqual({
      owner: 'deepdotspace',
      repo: 'threadhunt',
    })
  })

  it('rejects an incomplete repository URL', () => {
    expect(() => parseGitHubUrl('https://github.com/deepdotspace')).toThrow(/owner\/repo/)
  })
})
