import { describe, expect, it } from 'vitest';

import { getPdpSku } from './getPdpSku';

describe('getPdpSku', () => {
  it('reads translated SKU markup as text when B2B-3474 is enabled', () => {
    const element = document.createElement('span');
    element.innerHTML = '<font dir="auto"><font dir="auto">81006564</font></font>';

    expect(getPdpSku(element, true)).toBe('81006564');
  });

  it('preserves legacy SKU markup when B2B-3474 is disabled', () => {
    const element = document.createElement('span');
    element.innerHTML = '<font dir="auto">81006564</font>';

    expect(getPdpSku(element, false)).toBe('<font dir="auto">81006564</font>');
  });

  it('decodes special characters when B2B-3474 is enabled', () => {
    const element = document.createElement('span');
    element.innerHTML = 'A&amp;B';

    expect(getPdpSku(element, true)).toBe('A&B');
  });

  it('returns an empty string when the SKU element is absent', () => {
    expect(getPdpSku(null, true)).toBe('');
  });
});
