import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Each test dynamically imports useLocaleBundle after mocking locales,
// so the module registry must be reset between tests.
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

  it('sets ready=true when fallback loader exists but rejects', async () => {
    vi.doMock('./pickLocaleBundle', () => ({
      getFallbackLocale: () => 'es',
    }));
    vi.doMock('./locales', () => ({
      en: { greeting: 'Hello' },
      localeLoaders: {
        es: () => Promise.reject(new Error('chunk load failure')),
      },
    }));

    const { useLocaleBundle: hook } = await import('./useLocaleBundle');
    const { result } = renderHook(() => hook('es-MX'));

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.bundles.es).toBeUndefined();
  });
});
