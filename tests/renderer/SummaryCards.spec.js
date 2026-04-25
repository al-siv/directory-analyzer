import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Component tests for SummaryCards.
 *
 * @module tests/renderer/SummaryCards.spec
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from '@renderer/components/SummaryCards';
import { useScanStore } from '@renderer/store/scanStore';
describe('SummaryCards', () => {
    beforeEach(() => {
        useScanStore.setState({
            ...useScanStore.getState(),
            scanResult: null,
        });
    });
    it('renders nothing when no scan result is present', () => {
        const { container } = render(_jsx(SummaryCards, {}));
        expect(container.firstChild).toBeNull();
    });
    it('renders summary cards with scan statistics', () => {
        useScanStore.setState({
            ...useScanStore.getState(),
            scanResult: {
                directories: [],
                totalScanned: 10,
                errorCount: 1,
                accessErrors: ['/private/var/db'],
                scanDuration: 1.25,
                scanOptions: {
                    targetPath: '/tmp',
                    includeHidden: true,
                    minSizeBytes: 0,
                    topCount: 50,
                    outputFormat: 'text',
                    extensionFilter: null,
                },
                statistics: {
                    totalDirectories: 10,
                    totalFiles: 42,
                    totalSizeBytes: 1610612736,
                    scanDuration: 1.25,
                    categoryBreakdown: {},
                    fileCountByCategory: {},
                },
            },
        });
        render(_jsx(SummaryCards, {}));
        expect(screen.getByText('Directories')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Files')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Total Size')).toBeInTheDocument();
        expect(screen.getByText('1.5 GB')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
        expect(screen.getByText('1.25s')).toBeInTheDocument();
        expect(screen.getByText('Errors')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
