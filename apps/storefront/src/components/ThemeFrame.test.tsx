import {
  describe,
  expect,
  it,
} from 'vitest'
import Button from '@mui/material/Button'
import { ThemeFrame } from './ThemeFrame'
import { render, screen } from '../utils/test-utils'

describe('ThemeFrame', () => {
  it('should render iframe and main document should not contain anything else', () => {
    expect(document.head.querySelector('style')).toBeNull()

    render(
      <ThemeFrame title="test-frame">
        <Button id="test-button">Test Button</Button>
      </ThemeFrame>,
    )

    expect(document.querySelector('button')).toBeNull()
    expect(document.head.querySelector('style')).toBeNull()
  })

  it('should render iframe, and all children and styles sandboxed within it', () => {
    render(
      <ThemeFrame title="test-frame">
        <Button id="test-button">Test Button</Button>
      </ThemeFrame>,
    )

    const iframe: HTMLIFrameElement = screen.getByTitle('test-frame')
    expect(iframe).toBeDefined()
    expect(iframe.contentDocument).toBeDefined()

    const iframeDocument = iframe.contentDocument as Document
    expect(iframeDocument.getElementById('test-button')).toBeDefined()

    const styles = iframeDocument.head.querySelectorAll('style')
    expect(styles).toBeDefined()
    expect(styles.length).toBeGreaterThan(0)
  })
})
