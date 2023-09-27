import Button from '@mui/material/Button'
import { describe, expect, it } from 'vitest'

import { ThemeFrame } from '../../src/components'
import { renderWithProviders, screen } from '../test-utils'

describe('ThemeFrame', () => {
  it('should render iframe and main document should not contain anything else', () => {
    expect(document.head.querySelector('style')).toBeNull()

    renderWithProviders(
      <ThemeFrame title="test-frame">
        <Button id="test-button">Test Button</Button>
      </ThemeFrame>
    )

    expect(document.querySelector('button')).toBeNull()
    expect(document.head.querySelector('style')).toBeDefined()
  })
  it('should render iframe, and all children and styles sandboxed within it', () => {
    renderWithProviders(
      <ThemeFrame title="test-frame">
        <Button id="test-button">Test Button</Button>
      </ThemeFrame>
    )

    const iframe: HTMLIFrameElement = screen.getByTitle('test-frame')
    expect(iframe).toBeDefined()
    expect(iframe.contentDocument).toBeDefined()

    const iframeDocument = iframe.contentDocument as Document
    expect(iframeDocument.getElementById('test-button')).toBeDefined()

    const styles = iframeDocument.head.querySelectorAll('style')
    expect(styles).toBeDefined()
  })
})
