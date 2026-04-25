import { describe, it, expect } from 'vitest'
import { bytesToHumanReadable, formatPercentage, formatPathForDisplay, pluralize } from '@main/utils/format'

describe('bytesToHumanReadable', () => {
  it('returns "0 B" for zero', () => {
    expect(bytesToHumanReadable(0)).toBe('0 B')
  })

  it('throws for negative values', () => {
    expect(() => bytesToHumanReadable(-1)).toThrow(RangeError)
  })

  it('formats bytes without decimals', () => {
    expect(bytesToHumanReadable(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(bytesToHumanReadable(1024)).toBe('1.0 KB')
  })

  it('formats megabytes', () => {
    expect(bytesToHumanReadable(1024 * 1024 * 1.5)).toBe('1.5 MB')
  })

  it('formats gigabytes', () => {
    expect(bytesToHumanReadable(1610612736)).toBe('1.5 GB')
  })

  it('formats terabytes', () => {
    expect(bytesToHumanReadable(1099511627776 * 2)).toBe('2.0 TB')
  })
})

describe('formatPercentage', () => {
  it('shows "<0.01%" for tiny values', () => {
    expect(formatPercentage(0.005)).toBe('<0.01%')
  })

  it('shows two decimals for normal values', () => {
    expect(formatPercentage(18.146)).toBe('18.15%')
  })

  it('shows sub-threshold as <0.01%', () => {
    expect(formatPercentage(0)).toBe('<0.01%')
    expect(formatPercentage(0.005)).toBe('<0.01%')
  })
})

describe('formatPathForDisplay', () => {
  it('returns short paths unchanged', () => {
    expect(formatPathForDisplay('/short/path')).toBe('/short/path')
  })

  it('truncates long paths from the middle', () => {
    const long = '/very/long/path/that/exceeds/the/maximum/length/significantly/yes/it/does'
    const result = formatPathForDisplay(long, 40)
    expect(result.length).toBeLessThanOrEqual(40)
    expect(result).toContain('...')
  })
})

describe('pluralize', () => {
  it('uses singular for count 1', () => {
    expect(pluralize(1, 'file')).toBe('1 file')
  })

  it('uses plural for count > 1', () => {
    expect(pluralize(5, 'file')).toBe('5 files')
  })

  it('accepts custom plural form', () => {
    expect(pluralize(2, 'child', 'children')).toBe('2 children')
  })
})
