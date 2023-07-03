import { MouseEvent } from 'react'
import { Button, ButtonProps, SxProps, useTheme } from '@mui/material'

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void
  sx?: SxProps
  customLabel?: string
  children: React.ReactNode
}

function CustomButton({ onClick, sx, children, ...rest }: CustomButtonProps) {
  const theme = useTheme()
  return (
    <Button
      {...rest}
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: getContrastColor(theme.palette.primary.main),
        ...(sx || {}),
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
export default CustomButton
