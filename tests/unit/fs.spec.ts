import { describe, it, expect } from 'vitest'
import { isHiddenDirectory, isAccessibleDirectory, safeGetFileSize, getDirectFiles, getSubdirectories } from '@main/utils/fs'
import { join } from 'path'

describe('fs utilities', () => {
  const fixtureDir = join(process.cwd(), 'tests/fixtures/mixed-content')

  describe('isAccessibleDirectory', () => {
    it('returns true for existing directory', async () => {
      expect(await isAccessibleDirectory(fixtureDir)).toBe(true)
    })

    it('returns false for non-existing path', async () => {
      expect(await isAccessibleDirectory('/definitely/does/not/exist')).toBe(false)
    })
  })

  describe('safeGetFileSize', () => {
    it('returns correct size for existing file', async () => {
      const size = await safeGetFileSize(join(fixtureDir, 'root.txt'))
      expect(size).toBe(1000)
    })

    it('returns 0 for missing file', async () => {
      expect(await safeGetFileSize('/nonexistent/file.txt')).toBe(0)
    })
  })

  describe('getDirectFiles', () => {
    it('yields only direct files', async () => {
      const files: string[] = []
      for await (const f of getDirectFiles(fixtureDir)) {
        files.push(f)
      }
      expect(files).toContain('root.txt')
      expect(files).not.toContain('subdir1')
    })
  })

  describe('getSubdirectories', () => {
    it('yields subdirectories', async () => {
      const dirs: string[] = []
      for await (const d of getSubdirectories(fixtureDir, true)) {
        dirs.push(d)
      }
      expect(dirs).toContain('subdir1')
      expect(dirs).toContain('subdir2')
    })

    it('skips hidden dirs when includeHidden is false', async () => {
      const hiddenFixture = join(process.cwd(), 'tests/fixtures/hidden-dirs')
      const dirs: string[] = []
      for await (const d of getSubdirectories(hiddenFixture, false)) {
        dirs.push(d)
      }
      expect(dirs).toContain('visible')
      expect(dirs).not.toContain('.hidden')
    })
  })

  describe('isHiddenDirectory', () => {
    it('detects dot-prefix directories as hidden', () => {
      expect(isHiddenDirectory('/home/user/.config')).toBe(true)
      expect(isHiddenDirectory('/home/user/Documents')).toBe(false)
    })
  })
})
