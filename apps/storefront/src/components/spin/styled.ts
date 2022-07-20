import styled from '@emotion/styled'

const SpinCenter = styled.div({
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
  backgroundColor: 'rgba(255, 255, 255, .75)',
})

const SpinTip = styled.div({
  color: '#0072E5',
  marginTop: '12px',
})

const SpinContext = styled.div({
  position: 'relative',
})

export {
  SpinCenter,
  SpinTip,
  SpinContext,
}
