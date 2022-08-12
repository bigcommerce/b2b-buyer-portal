import {
  ComponentType,
} from 'react'

import {
  styled,
} from '@mui/material/styles'

import Button, {
  ButtonProps,
} from '@mui/material/Button'

import {
  B3ButtonProps,
} from './config'

type StyledButtonProps = ButtonProps & B3ButtonProps

export const LoginContainer = styled('div')({
  padding: '20px 20px',
})

export const LoginImage = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '130px',
})

// export const B3Button = styled(Button)(({
//   btnColor,
// }: B3ButtonProps) => ({
//   backgroundColor: btnColor,
// '&:hover': {
//   backgroundColor: btnColor,
// },
// }))

export const B3Button = styled(Button, {
  shouldForwardProp: (props) =>
    props !== 'btnColor',
})`
  backgroundColor: ${(props: StyledButtonProps) => props.btnColor}
  '&:hover': {
    backgroundColor: ${(props: StyledButtonProps) => props.btnColor}
  },
`as ComponentType<StyledButtonProps>

export const B3ForgotButton = styled(Button)({
  height: '40px',
})
