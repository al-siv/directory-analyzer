/**
 * Scan result exporter.
 *
 * @description Generates text, CSV and JSON exports. The formats are
 *              semantically equivalent to Python v1.2.1 with improved
 *              readability and alignment.
 *
 * @module main/core/exporter
 */

import { writeFile } from 'fs/promises'
import type { ScanResult, OutputFormat } from '@shared/types'
import { bytesToHumanReadable, formatPercentage } from '@main/utils/format'

/**
 * Generate the export string for the requested format and write it to disk.
 *
 * @description This is the primary public API for exporting scan results.
 * @param scanResult - Completed scan data.
 * @param format - Desired output format.
 * @param outputPath - Absolute path for the output file.
 * @returns Promise that resolves when the file is written.
 * @throws {Error} If the format is unsupported or writing fails.
 */
export async function exportResults(
  scanResult: ScanResult,
  format: OutputFormat,
  outputPath: string
): Promise<void> {
  let content: string

  switch (format) {
    case 'text':
      content = generateTextExport(scanResult)
      break
    case 'csv':
      content = generateCsvExport(scanResult)
      break
    case 'json':
      content = generateJsonExport(scanResult)
      break
    default:
      throw new Error(`Unsupported output format: ${format}`)
  }

  await writeFile(outputPath, content, 'utf-8')
}

/**
 * Build a human-readable text report.
 */
function generateTextExport(result: ScanResult): string {
  const stats = result.statistics
  const lines: string[] = []

  lines.push('Directory Analyzer - Personal Storage Analytics Report')
  lines.push('='.repeat(60))
  lines.push('')

  if (stats) {
    lines.push('Scan Summary:')
    lines.push(`  Target Path:        ${result.scanOptions.targetPath}`)
    lines.push(`  Total Directories:  ${stats.totalDirectories.toLocaleString()}`)
    lines.push(`  Total Files:        ${stats.totalFiles.toLocaleString()}`)
    lines.push(`  Total Size:         ${bytesToHumanReadable(stats.totalSizeBytes)}`)
    lines.push(`  Scan Duration:      ${stats.scanDuration.toFixed(2)}s`)

    if (result.errorCount > 0) {
      lines.push(`  Access Errors:      ${result.errorCount}`)
      lines.push(`  Success Rate:       ${((1 - result.errorCount / result.totalScanned) * 100).toFixed(1)}%`)
    }
    lines.push('')
  }

  lines.push('Directory Listing (sorted by size):')
  lines.push('-'.repeat(60))

  const totalSize = stats?.totalSizeBytes ?? result.directories.reduce((s, d) => s + d.sizeBytes, 0)

  for (let i = 0; i < result.directories.length; i++) {
    const d = result.directories[i]
    const pct = totalSize > 0 ? (d.sizeBytes / totalSize) * 100 : 0
    const pctStr = formatPercentage(pct)
    lines.push(
      `${String(i + 1).padStart(4)}. ${bytesToHumanReadable(d.sizeBytes).padStart(8)} (${pctStr.padStart(6)}) - ${d.path} (${d.fileCount.toLocaleString()} files)`
    )
  }

  if (stats && Object.keys(stats.categoryBreakdown).length > 0) {
    lines.push('')
    lines.push('Content Type Analysis:')
    lines.push('-'.repeat(60))

    const sortedCats = Object.entries(stats.categoryBreakdown).sort((a, b) => b[1] - a[1])
    for (const [cat, sizeBytes] of sortedCats) {
      if (sizeBytes <= 0) continue
      const pct = totalSize > 0 ? (sizeBytes / totalSize) * 100 : 0
      const pctStr = formatPercentage(pct)
      const fc = stats.fileCountByCategory[cat] ?? 0
      lines.push(
        `  ${cat.padEnd(20)} ${bytesToHumanReadable(sizeBytes).padStart(10)} (${pctStr.padStart(6)}) - ${fc.toLocaleString()} files`
      )
    }
  }

  return lines.join('\n')
}

/**
 * Build a CSV export.
 */
function generateCsvExport(result: ScanResult): string {
  const stats = result.statistics
  const lines: string[] = []

  if (stats) {
    lines.push('# Directory Analyzer Results')
    lines.push(`# Total Directories,${stats.totalDirectories}`)
    lines.push(`# Total Files,${stats.totalFiles}`)
    lines.push(`# Total Size (bytes),${stats.totalSizeBytes}`)
    lines.push(`# Scan Duration (seconds),${stats.scanDuration.toFixed(2)}`)
    lines.push('')
  }

  lines.push('Rank,Path,Size (bytes),Size (HR),Percentage,File Count')

  const totalSize = stats?.totalSizeBytes ?? result.directories.reduce((s, d) => s + d.sizeBytes, 0)

  for (let i = 0; i < result.directories.length; i++) {
    const d = result.directories[i]
    const pct = totalSize > 0 ? (d.sizeBytes / totalSize) * 100 : 0
    const pctStr = formatPercentage(pct)
    lines.push(
      `${i + 1},"${d.path}",${d.sizeBytes},${bytesToHumanReadable(d.sizeBytes)},${pctStr},${d.fileCount}`
    )
  }

  return lines.join('\n')
}

/**
 * Build a JSON export.
 */
function generateJsonExport(result: ScanResult): string {
  const stats = result.statistics
  const totalSize = stats?.totalSizeBytes ?? result.directories.reduce((s, d) => s + d.sizeBytes, 0)

  const contentAnalysis: Record<string, { sizeBytes: number; percentage: number; fileCount: number; displayName: string }> = {}

  if (stats) {
    for (const [cat, sizeBytes] of Object.entries(stats.categoryBreakdown)) {
      if (sizeBytes <= 0) continue
      const pct = totalSize > 0 ? (sizeBytes / totalSize) * 100 : 0
      contentAnalysis[cat] = {
        sizeBytes,
        percentage: Number(pct.toFixed(2)),
        fileCount: stats.fileCountByCategory[cat] ?? 0,
        displayName: cat
      }
    }
  }

  const payload = {
    summary: {
      targetPath: result.scanOptions.targetPath,
      totalDirectories: stats?.totalDirectories ?? result.directories.length,
      totalFiles: stats?.totalFiles ?? 0,
      totalSizeBytes: totalSize,
      totalSizeHuman: stats ? bytesToHumanReadable(stats.totalSizeBytes) : 'Unknown',
      scanDuration: stats?.scanDuration ?? 0,
      errorCount: result.errorCount,
      successRate: result.totalScanned > 0 ? (result.totalScanned - result.errorCount) / result.totalScanned : 0
    },
    directories: result.directories.map((d, idx) => {
      const pct = totalSize > 0 ? (d.sizeBytes / totalSize) * 100 : 0
      return {
        rank: idx + 1,
        path: d.path,
        sizeBytes: d.sizeBytes,
        sizeHuman: bytesToHumanReadable(d.sizeBytes),
        percentage: Number(pct.toFixed(2)),
        fileCount: d.fileCount,
        hasError: d.errorMessage !== null,
        errorMessage: d.errorMessage
      }
    }),
    contentAnalysis
  }

  return JSON.stringify(payload, null, 2)
}
