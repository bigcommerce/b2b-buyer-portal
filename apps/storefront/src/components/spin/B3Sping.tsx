import {
  ReactNode,
} from 'react'
import {
  CircularProgress,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

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
  background?: string,
}

export const B3Sping = (props: B3SpingProps) => {
  const {
    isSpinning,
    children,
    tip = 'loading',
    size,
    thickness,
    isCloseLoading,
    background,
  } = props

  const [isMobile] = useMobile()

  return (
    <SpinContext>
      {
      isSpinning && (
        <SpinCenter
          background={background}
          isMobile={isMobile}
        >
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
