import {
  Button,
  ButtonProps,
  SxProps,
} from '@mui/material'

import {
  MouseEvent,
} from 'react'

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void,
  sx?: SxProps,
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
    variant,
  } = rest

  return (
    <>
      {
        (variant === 'contained') ? (
          <Button
            {...rest}
            sx={{
              ...sx || {},
            }}
            onClick={onClick}
          >
            {children}
          </Button>
        ) : (
          <Button
            {...rest}
            sx={{
              ...sx || {},
            }}
            onClick={onClick}
          >
            {children}
          </Button>
        )
      }
      {

      }
    </>
  )
}

export {
  CustomButton,
}
