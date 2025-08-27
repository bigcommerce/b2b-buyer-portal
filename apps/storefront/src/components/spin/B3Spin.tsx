import { useB3Lang } from '@b3/lang';
import { CircularProgress, useTheme } from '@mui/material';
import { ReactNode } from 'react';

import useMobile from '@/hooks/useMobile';

import { SpinCenter, SpinContext, SpinTip } from './styled';

interface B3SpinProps {
  isSpinning: boolean | undefined;
  children: ReactNode;
  tip?: string;
  size?: number;
  thickness?: number & undefined;
  isCloseLoading?: boolean;
  background?: string;
  spinningHeight?: number | string;
  isFlex?: boolean;
  transparency?: string;
}

export default function B3Spin(props: B3SpinProps) {
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
  } = props;

  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  return (
    <SpinContext height={spinningHeight} isFlex={isFlex}>
      {isSpinning && (
        <SpinCenter background={background} isMobile={isMobile} transparency={transparency}>
          {!isCloseLoading && (
            <CircularProgress role="progressbar" size={size || 40} thickness={thickness || 2} />
          )}
          {tip && (
            <SpinTip
              role="progressbar"
              style={{
                color: primaryColor,
              }}
            >
              {b3Lang('global.tips.loading')}
            </SpinTip>
          )}
        </SpinCenter>
      )}
      {children}
    </SpinContext>
  );
}
