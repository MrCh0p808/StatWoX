import '@testing-library/jest-dom';
import './mocks/db';
import { vi } from 'vitest';

process.env.JWT_SECRET = 'super-secret-test-key-needs-to-be-thirty-two-chars-long';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};
