import {
  Button,
  ButtonProps,
} from '@mui/material'

import {
  useContext,
} from 'react'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

interface CustomButtonProps extends ButtonProps {
  onClick?: () => void;
  sx?: any;
  customLabel?: string;
  children: React.ReactNode
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
      golbalBackgroundColor,
    },
  } = useContext(CustomStyleContext)
  return (
    <Button
      {...rest}
      sx={{
        ...sx || {},
        color: globalColor,
        backgroundColor: golbalBackgroundColor,
        '&:hover': {
          color: globalColor,
          backgroundColor: golbalBackgroundColor,
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
