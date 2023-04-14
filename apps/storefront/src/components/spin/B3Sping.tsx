import {
  ReactNode,
  useContext,
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

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

interface B3SpingProps {
  isSpinning: Boolean | undefined,
  children: ReactNode,
  tip?: string,
  size?: number,
  thickness?: number & undefined,
  isCloseLoading?: Boolean,
  background?: string,
  spinningHeight?: number | string,
  isFlex?: boolean,
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
    spinningHeight,
    isFlex,
  } = props

  const {
    state: {
      portalStyle: {
        primaryColor = '',
      },
    },
  } = useContext(CustomStyleContext)

  const [isMobile] = useMobile()

  return (
    <SpinContext
      isFlex={isFlex}
      height={spinningHeight}
    >
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
            tip && (
            <SpinTip style={{
              color: primaryColor,
            }}
            >
              { tip }
            </SpinTip>
            )
          }
        </SpinCenter>
      )
    }
      {children}
    </SpinContext>
  )
}
