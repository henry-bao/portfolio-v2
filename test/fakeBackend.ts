import { mock } from 'bun:test';
import { createFakeAppwrite } from './fakeAppwrite';
import type { FakeAppwrite } from './fakeAppwrite';

/**
 * Routes every data-layer call to an in-memory fake. Import this before the module under test,
 * and call `resetFakeAppwrite()` in `beforeEach` for a clean slate.
 */
let current: FakeAppwrite = createFakeAppwrite();

void mock.module('../src/api/core/client', () => ({
    getBackend: () => current.backend,
    getBackendOrNull: () => current.backend,
}));

export const fakeAppwrite = () => current;

export const resetFakeAppwrite = (options?: Parameters<typeof createFakeAppwrite>[0]) => {
    current = createFakeAppwrite(options);
    return current;
};
