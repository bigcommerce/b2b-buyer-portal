import styled from '@emotion/styled'

interface SpinCenterProps {
  background?: string,
}

const SpinCenter = styled('div')(({
  background,
}: SpinCenterProps) => ({
  position: 'absolute',
  zIndex: 100,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: background || 'rgba(255, 255, 255, .75)',
}))

const SpinTip = styled.div({
  color: '#0072E5',
  marginTop: '12px',
})

const SpinContext = styled.div({
  position: 'relative',
  height: '100%',
  width: '100%',
  display: 'flex',
})

export {
  SpinCenter,
  SpinTip,
  SpinContext,
}
