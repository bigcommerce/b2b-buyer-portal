import { ReactNode } from 'react'
import {
  CircularProgress,
} from '@mui/material'

import {
  SpinCenter,
  SpinTip,
  SpinContext,
} from './style'

interface B3SpingProps {
  isSpinning: Boolean,
  children: ReactNode,
  tip?: string,
  size?: Number & undefined,
  thickness?: Number & undefined,
  isCloseLoadding?: Boolean,
}

export const B3Sping = (props: B3SpingProps) => {
  const {
    isSpinning, children, tip, size, thickness, isCloseLoadding,
  } = props

  return (
    <SpinContext>
      {
      isSpinning && (
        <SpinCenter>
          {
            !isCloseLoadding && (
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
