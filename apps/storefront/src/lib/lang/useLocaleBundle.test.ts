import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useLocaleBundle } from './useLocaleBundle';

// Access the module-level cache via a side-effect reset between tests.
// Each test re-imports fresh by clearing the module registry.
afterEach(() => {
  vi.resetModules();
});

describe('useLocaleBundle — loader failure recovery', () => {
  it('sets ready=true and returns an empty bundle when the dynamic import rejects', async () => {
    vi.doMock('./locales', () => ({
      en: { greeting: 'Hello' },
      localeLoaders: {
        fr: () => Promise.reject(new Error('network error')),
      },
    }));

    const { useLocaleBundle: hook } = await import('./useLocaleBundle');
    const { result } = renderHook(() => hook('fr'));

    await waitFor(() => expect(result.current.ready).toBe(true));
    // Failed import → no fr bundle → pickLocaleBundle returns {} → falls back to en
    expect(result.current.bundles.fr).toBeUndefined();
  });
});
