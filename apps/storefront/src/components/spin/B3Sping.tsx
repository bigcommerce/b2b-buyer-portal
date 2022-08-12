import {
  ReactNode,
} from 'react'
import {
  CircularProgress,
} from '@mui/material'

import {
  SpinCenter,
  SpinTip,
  SpinContext,
} from './styled'

interface B3SpingProps {
  isSpinning: Boolean | undefined,
  children: ReactNode,
  tip?: string,
  size?: number,
  thickness?: number & undefined,
  isCloseLoading?: Boolean,
}

export const B3Sping = (props: B3SpingProps) => {
  const {
    isSpinning,
    children,
    tip,
    size,
    thickness,
    isCloseLoading,
  } = props

  return (
    <SpinContext>
      {
      isSpinning && (
        <SpinCenter>
          {
            !isCloseLoading && (
            <CircularProgress
              size={size || 40}
              thickness={thickness || 2}
            />
            )
          }
          {
            tip && <SpinTip>{ tip }</SpinTip>
          }
        </SpinCenter>
      )
    }
      {children}
    </SpinContext>

  )
}
