import {
  Button,
  ButtonProps,
} from '@mui/material'

import {
  useContext,
  MouseEvent,
} from 'react'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void,
  sx?: any,
  customLabel?: string,
  children: React.ReactNode,
}

const CustomButton = ({
  onClick,
  sx,
  children,
  ...rest
}: CustomButtonProps) => {
  const {
    state: {
      globalColor,
      globalBackgroundColor,
      portalStyle,
    },
  } = useContext(CustomStyleContext)

  const {
    primaryColor = '',
    backgroundColor = '',
  } = portalStyle

  return (
    <Button
      {...rest}
      sx={{
        ...sx || {},
        color: primaryColor || globalColor,
        backgroundColor: backgroundColor || globalBackgroundColor,
        '&:hover': {
          color: primaryColor || globalColor,
          backgroundColor: backgroundColor || globalBackgroundColor,
        },
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export {
  CustomButton,
}
