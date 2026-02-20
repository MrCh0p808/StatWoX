import { vi } from 'vitest';

export const mockDb = {
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    survey: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    response: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
    },
    question: {
        createMany: vi.fn(),
        findMany: vi.fn(),
    },
    answer: {
        createMany: vi.fn(),
    },
    notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockDb)),
};

vi.mock('@/lib/db', () => ({
    db: mockDb,
}));
