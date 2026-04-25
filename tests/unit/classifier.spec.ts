import { describe, it, expect } from 'vitest';
import { ContentClassifier } from '@main/core/classifier';

describe('ContentClassifier', () => {
  const classifier = new ContentClassifier();

  describe('classifyFile', () => {
    it('classifies images correctly', () => {
      const cases = ['test.jpg', 'photo.PNG', 'image.gif', 'raw.CR2', 'vector.svg'];
      for (const file of cases) {
        expect(classifier.classifyFile(file), `failed for ${file}`).toBe('images');
      }
    });

    it('classifies videos correctly', () => {
      const cases = ['movie.mp4', 'video.AVI', 'stream.mkv', 'old.wmv', 'web.webm'];
      for (const file of cases) {
        expect(classifier.classifyFile(file), `failed for ${file}`).toBe('videos');
      }
    });

    it('classifies documents correctly', () => {
      const cases = ['book.pdf', 'ebook.epub', 'manual.chm', 'novel.mobi'];
      for (const file of cases) {
        expect(classifier.classifyFile(file), `failed for ${file}`).toBe('documents');
      }
    });

    it('classifies office files correctly', () => {
      const cases = [
        'report.docx',
        'spreadsheet.xlsx',
        'presentation.pptx',
        'notes.txt',
        'readme.md',
      ];
      for (const file of cases) {
        expect(classifier.classifyFile(file), `failed for ${file}`).toBe('office');
      }
    });

    it('classifies unknown extensions as other', () => {
      expect(classifier.classifyFile('mystery.unknownext')).toBe('other');
    });

    it('resolves overlapping extensions by insertion order (archives before system)', () => {
      // .exe exists in both archives and system; archives was inserted first.
      expect(classifier.classifyFile('setup.exe')).toBe('archives');
    });
  });

  describe('custom categories', () => {
    it('allows adding a custom category', () => {
      const custom = new ContentClassifier();
      custom.addCustomCategory('custom', new Set(['.xyz', '.abc']));
      expect(custom.classifyFile('test.xyz')).toBe('custom');
    });
  });

  describe('statistics', () => {
    it('calculates category statistics by size', () => {
      const files = [
        { path: 'a.jpg', sizeBytes: 1000, extension: '.jpg', category: 'images', mimeType: null },
        { path: 'b.mp4', sizeBytes: 5000, extension: '.mp4', category: 'videos', mimeType: null },
        {
          path: 'c.pdf',
          sizeBytes: 2000,
          extension: '.pdf',
          category: 'documents',
          mimeType: null,
        },
        { path: 'd.jpg', sizeBytes: 1500, extension: '.jpg', category: 'images', mimeType: null },
      ] as const;

      const stats = classifier.getCategoryStatistics(
        files as unknown as readonly import('@shared/types').FileInfo[]
      );
      expect(stats['images']).toBe(2500);
      expect(stats['videos']).toBe(5000);
      expect(stats['documents']).toBe(2000);

      const counts = classifier.getFileCountByCategory(
        files as unknown as readonly import('@shared/types').FileInfo[]
      );
      expect(counts['images']).toBe(2);
      expect(counts['videos']).toBe(1);
    });

    it('determines dominant category by size', () => {
      const files = [
        { path: 'a.jpg', sizeBytes: 100, extension: '.jpg', category: 'images', mimeType: null },
        { path: 'b.mp4', sizeBytes: 500, extension: '.mp4', category: 'videos', mimeType: null },
      ] as const;
      const dominant = classifier.getDominantCategory(
        files as unknown as readonly import('@shared/types').FileInfo[]
      );
      expect(dominant).toBe('videos');
    });

    it('returns "other" for empty file list', () => {
      expect(classifier.getDominantCategory([])).toBe('other');
    });
  });

  describe('display names', () => {
    it('returns mapped display names', () => {
      expect(classifier.getCategoryDisplayName('images')).toBe('Images');
      expect(classifier.getCategoryDisplayName('documents')).toBe('Documents/Books');
    });

    it('title-cases unknown categories', () => {
      expect(classifier.getCategoryDisplayName('foobar')).toBe('Foobar');
    });
  });
});
