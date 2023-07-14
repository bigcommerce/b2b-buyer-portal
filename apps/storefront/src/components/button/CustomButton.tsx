import { MouseEvent } from 'react'
import { Button, ButtonProps, SxProps } from '@mui/material'

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void
  sx?: SxProps
  customLabel?: string
  children: React.ReactNode
}

function CustomButton({ onClick, sx, children, ...rest }: CustomButtonProps) {
  return (
    <Button
      {...rest}
      sx={{
        ...(sx || {}),
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
export default CustomButton
