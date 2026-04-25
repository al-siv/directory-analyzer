import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Component tests for ThemeToggle.
 *
 * @module tests/renderer/ThemeToggle.spec
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@renderer/components/ThemeToggle';
import { useScanStore } from '@renderer/store/scanStore';
describe('ThemeToggle', () => {
    beforeEach(() => {
        useScanStore.setState({
            ...useScanStore.getState(),
            theme: 'dark',
        });
    });
    it('renders with dark theme initial state', () => {
        render(_jsx(ThemeToggle, {}));
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeInTheDocument();
    });
    it('toggles theme when clicked', () => {
        render(_jsx(ThemeToggle, {}));
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(useScanStore.getState().theme).toBe('dark');
        fireEvent.click(button);
        expect(useScanStore.getState().theme).toBe('light');
        fireEvent.click(button);
        expect(useScanStore.getState().theme).toBe('dark');
    });
});
