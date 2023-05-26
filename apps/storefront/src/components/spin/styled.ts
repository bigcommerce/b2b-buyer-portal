import styled from '@emotion/styled'

interface SpinCenterProps {
  background?: string
  isMobile?: boolean
  transparency?: string
}

const SpinCenter = styled('div')(
  ({ background, isMobile, transparency }: SpinCenterProps) => ({
    position: isMobile ? 'fixed' : 'absolute',
    zIndex: 100,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: background || `rgba(255, 255, 255, ${transparency})`,
  })
)

const SpinTip = styled.div({
  color: '#0072E5',
  marginTop: '12px',
})

styled('div')(() => ({
  position: 'relative',
  height: '100%',
  width: '100%',
  display: 'flex',
}))

interface SpinContextProps {
  height?: number | string
  isFlex?: boolean
}

const SpinContext = styled('div')(
  ({ height, isFlex = true }: SpinContextProps) => ({
    position: 'relative',
    height: height || '100%',
    width: '100%',
    display: isFlex ? 'flex' : 'block',
  })
)

export { SpinCenter, SpinContext, SpinTip }
