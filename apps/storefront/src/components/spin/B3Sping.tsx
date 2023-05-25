import { ReactNode } from 'react'
import { CircularProgress, useTheme } from '@mui/material'

import { useMobile } from '@/hooks'

import { SpinCenter, SpinContext, SpinTip } from './styled'

interface B3SpingProps {
  isSpinning: boolean | undefined
  children: ReactNode
  tip?: string
  size?: number
  thickness?: number & undefined
  isCloseLoading?: boolean
  background?: string
  spinningHeight?: number | string
  isFlex?: boolean
  transparency?: string
}

export default function B3Sping(props: B3SpingProps) {
  const {
    isSpinning,
    children,
    tip = 'loading',
    size,
    thickness,
    isCloseLoading,
    background,
    spinningHeight,
    isFlex,
    transparency = '1',
  } = props

  const theme = useTheme()

  const primaryColor = theme.palette.primary.main

  const [isMobile] = useMobile()

  return (
    <SpinContext isFlex={isFlex} height={spinningHeight}>
      {isSpinning && (
        <SpinCenter
          background={background}
          isMobile={isMobile}
          transparency={transparency}
        >
          {!isCloseLoading && (
            <CircularProgress size={size || 40} thickness={thickness || 2} />
          )}
          {tip && (
            <SpinTip
              style={{
                color: primaryColor,
              }}
            >
              {tip}
            </SpinTip>
          )}
        </SpinCenter>
      )}
      {children}
    </SpinContext>
  )
}
