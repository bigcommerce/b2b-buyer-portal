import Button from '@mui/material/Button';
import { describe, expect, it } from 'vitest';

import { ThemeFrame } from '@/components';
import theme from '@/store/slices/theme';

import { renderWithProviders } from '../test-utils';

describe('ThemeFrame', () => {
  it('should render iframe and main document should not contain anything else', () => {
    const { store } = renderWithProviders(<ThemeFrame title="test-frame">{null}</ThemeFrame>, {
      reducer: { theme },
    });

    const iframeContentDocument = store.getState().theme.themeFrame;
    expect(iframeContentDocument.querySelector('style')).toBeDefined();
    expect(iframeContentDocument.body.innerHTML).toBeFalsy();
  });
  it('should render iframe, and all children and styles sandboxed within it', () => {
    const { store } = renderWithProviders(
      <ThemeFrame title="test-frame">
        <Button id="test-button">Test Button</Button>
      </ThemeFrame>,
      {
        reducer: { theme },
      },
    );

    const iframeContentDocument = store.getState().theme.themeFrame;
    expect(iframeContentDocument).toBeDefined();
    expect(iframeContentDocument.getElementById('test-button')).toBeDefined();

    const styles = iframeContentDocument.head.querySelectorAll('style');
    expect(styles).toBeDefined();
  });
});
