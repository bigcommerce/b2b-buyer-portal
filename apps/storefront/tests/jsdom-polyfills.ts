import { URLSearchParams } from 'node:url';

// Fix JSDOM/Node URLSearchParams mismatch that breaks fetch in tests
// JSDOM provides its own URLSearchParams implementation, but fetch expects Node's native version.
// This polyfill replaces the global URLSearchParams with Node's implementation to ensure compatibility.

Object.defineProperties(globalThis, {
  URLSearchParams: { value: URLSearchParams },
});
