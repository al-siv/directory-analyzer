/**
 * File content classification engine.
 *
 * @description Ported from Python `classifier.py`. Extension maps and
 *              iteration order must be preserved for parity.
 *
 * @module main/core/classifier
 */

import type { FileInfo } from '@shared/types'
import { extname } from 'path'

/**
 * Canonical category display names.
 */
const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  images: 'Images',
  videos: 'Videos',
  audio: 'Audio',
  documents: 'Documents/Books',
  office: 'Office Documents',
  archives: 'Archives',
  code: 'Code/Development',
  system: 'System/Applications',
  other: 'Other'
}

/**
 * Extension-to-category mappings.
 *
 * @description Order matters. Python resolves overlaps by dict insertion
 *              order (archives before system). We use a Map with identical
 *              insertion order to guarantee parity.
 */
function createCategoryMap(): Map<string, ReadonlySet<string>> {
  const map = new Map<string, ReadonlySet<string>>()

  map.set(
    'images',
    new Set([
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg',
      '.raw', '.cr2', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2',
      '.pef', '.srw', '.x3f', '.ico', '.heic', '.heif', '.avif'
    ])
  )

  map.set(
    'videos',
    new Set([
      '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v',
      '.3gp', '.mpg', '.mpeg', '.m2v', '.mts', '.ts', '.vob', '.rm',
      '.rmvb', '.asf', '.ogv', '.dv', '.f4v', '.m4p', '.divx'
    ])
  )

  map.set(
    'audio',
    new Set([
      '.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma', '.opus',
      '.mp2', '.aiff', '.au', '.ra', '.ac3', '.dts', '.ape', '.tak',
      '.tta', '.wv', '.mka', '.caf', '.amr', '.3ga'
    ])
  )

  map.set(
    'documents',
    new Set([
      '.pdf', '.epub', '.mobi', '.chm', '.djvu', '.fb2', '.azw', '.azw3',
      '.azw4', '.lit', '.pdb', '.tcr', '.lrf', '.rb', '.pml', '.tr2', '.tr3'
    ])
  )

  map.set(
    'office',
    new Set([
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.md', '.txt',
      '.rtf', '.odt', '.ods', '.odp', '.odg', '.odf', '.sxw', '.sxc',
      '.sxi', '.wpd', '.wps', '.pages', '.numbers', '.key', '.tex'
    ])
  )

  map.set(
    'archives',
    new Set([
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.lzma',
      '.cab', '.iso', '.dmg', '.pkg', '.deb', '.rpm', '.msi', '.exe',
      '.z', '.lz', '.lzo', '.rz', '.sz', '.dz', '.tbz2', '.tgz', '.txz'
    ])
  )

  map.set(
    'code',
    new Set([
      '.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.rs', '.go',
      '.json', '.xml', '.yaml', '.yml', '.ini', '.cfg', '.conf', '.php',
      '.rb', '.pl', '.sh', '.bat', '.ps1', '.vbs', '.lua', '.r', '.m',
      '.swift', '.kt', '.scala', '.hs', '.clj', '.fs', '.ml', '.pas'
    ])
  )

  map.set(
    'system',
    new Set([
      '.exe', '.dll', '.sys', '.drv', '.ocx', '.cpl', '.scr', '.com',
      '.app', '.dmg', '.pkg', '.deb', '.rpm', '.so', '.dylib', '.ko',
      '.bin', '.run', '.bundle', '.framework', '.kext', '.prefpane'
    ])
  )

  return map
}

/**
 * Classifies files by extension into content categories.
 */
export class ContentClassifier {
  private readonly categories: Map<string, ReadonlySet<string>>

  /**
   * @param customCategories - Optional additional categories.
   */
  constructor(customCategories?: Readonly<Record<string, ReadonlySet<string>>>) {
    this.categories = createCategoryMap()

    if (customCategories) {
      for (const [name, extensions] of Object.entries(customCategories)) {
        this.categories.set(name, extensions)
      }
    }
  }

  /**
   * Determine the category for a file path.
   *
   * @param filePath - Absolute or relative file path.
   * @returns Category name, or "other" if no extension matches.
   */
  classifyFile(filePath: string): string {
    const extension = extname(filePath).toLowerCase()

    for (const [category, extensions] of this.categories) {
      if (extensions.has(extension)) {
        return category
      }
    }

    return 'other'
  }

  /**
   * Create a FileInfo object with classification metadata.
   *
   * @param filePath - Absolute file path.
   * @param fileSize - Size in bytes.
   * @returns Populated FileInfo.
   */
  classifyFileWithInfo(filePath: string, fileSize: number): FileInfo {
    const extension = extname(filePath).toLowerCase()
    const category = this.classifyFile(filePath)

    return {
      path: filePath,
      sizeBytes: fileSize,
      extension,
      category,
      mimeType: null
    }
  }

  /**
   * Aggregate total size per category.
   *
   * @param files - Files to analyse.
   * @returns Mapping category -> total bytes.
   */
  getCategoryStatistics(files: readonly FileInfo[]): Record<string, number> {
    const stats: Record<string, number> = {}

    for (const file of files) {
      stats[file.category] = (stats[file.category] ?? 0) + file.sizeBytes
    }

    return stats
  }

  /**
   * Aggregate file count per category.
   *
   * @param files - Files to analyse.
   * @returns Mapping category -> count.
   */
  getFileCountByCategory(files: readonly FileInfo[]): Record<string, number> {
    const counts: Record<string, number> = {}

    for (const file of files) {
      counts[file.category] = (counts[file.category] ?? 0) + 1
    }

    return counts
  }

  /**
   * Determine the dominant category by total size.
   *
   * @param files - Files to analyse.
   * @returns Category with the largest total size, or "other" when empty.
   */
  getDominantCategory(files: readonly FileInfo[]): string {
    if (files.length === 0) {
      return 'other'
    }

    const stats = this.getCategoryStatistics(files)
    let dominant = 'other'
    let maxSize = -1

    for (const [category, size] of Object.entries(stats)) {
      if (size > maxSize) {
        maxSize = size
        dominant = category
      }
    }

    return dominant
  }

  /**
   * Register a custom category.
   *
   * @param categoryName - New category identifier.
   * @param extensions - Set of extensions (with dots, any case).
   */
  addCustomCategory(categoryName: string, extensions: ReadonlySet<string>): void {
    const normalized = new Set<string>()
    for (const ext of extensions) {
      const lower = ext.toLowerCase()
      normalized.add(lower.startsWith('.') ? lower : `.${lower}`)
    }
    this.categories.set(categoryName, normalized)
  }

  /**
   * Return sorted list of category names.
   */
  getAllCategories(): string[] {
    return Array.from(this.categories.keys()).sort()
  }

  /**
   * Return a human-readable display name for a category.
   *
   * @param category - Category identifier.
   * @returns Display name, or title-cased fallback.
   */
  getCategoryDisplayName(category: string): string {
    return DISPLAY_NAMES[category] ?? category.charAt(0).toUpperCase() + category.slice(1)
  }
}
