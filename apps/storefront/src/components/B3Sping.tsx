import { ReactNode } from 'react'
import {
  CircularProgress,
} from '@mui/material'

import styled from '@emotion/styled'

const SpinCenter = styled.div({
  position: 'absolute',
  zIndex: 100,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, .75)',
})

const SpinTip = styled.div({
  color: '#0072E5',
  marginTop: '12px',
})

const SpinContext = styled.div({
  position: 'relative',
})

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
