import {
  Button,
  ButtonProps,
  SxProps,
} from '@mui/material'

import {
  useContext,
  MouseEvent,
} from 'react'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

import {
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'

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
    state: {
      globalButtonBackgroundColor,
      portalStyle,
    },
  } = useContext(CustomStyleContext)

  const {
    variant,
  } = rest

  const {
    primaryColor = '',
  } = portalStyle

  return (
    <>
      {
        (variant === 'contained') ? (
          <Button
            {...rest}
            sx={{
              ...sx || {},
              backgroundColor: primaryColor || globalButtonBackgroundColor,
              color: getContrastColor(primaryColor) || getContrastColor(globalButtonBackgroundColor),
              '&:hover': {
                backgroundColor: primaryColor || globalButtonBackgroundColor,
                color: getContrastColor(primaryColor) || getContrastColor(globalButtonBackgroundColor),
              },
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
              color: primaryColor || globalButtonBackgroundColor,
              borderColor: primaryColor,
              '&:hover': {
                color: primaryColor || globalButtonBackgroundColor,
                borderColor: primaryColor,
              },
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
