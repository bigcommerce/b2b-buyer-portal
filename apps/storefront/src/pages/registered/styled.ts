import styled from '@emotion/styled'

export const StyleTipContainer = styled('p')(() => ({
  textAlign: 'center',
  margin: '2rem auto',
}))

export const InformationLabels = styled('h3')(() => ({
  marginBottom: '20px',
}))

export const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}))

export const TipContent = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}))

export const TipLogin = styled('div')(() => ({
  cursor: 'pointer',
  color: '#1976d2',
  borderBottom: '1px solid #1976d2',
}))

export const RegisteredContainer = styled('div')({
  padding: '20px 20px',
})

export const RegisteredImage = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '150px',
})
