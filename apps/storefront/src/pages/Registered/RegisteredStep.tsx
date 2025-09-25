import { ReactNode, useContext, useMemo } from 'react';
import { Box, Step, StepLabel, Stepper, useTheme } from '@mui/material';

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';

import { RegisteredContext } from './context/RegisteredContext';
import { steps } from './config';

interface RegisteredStepProps {
  children: ReactNode;
  activeStep: number;
  backgroundColor: string;
}

export default function RegisteredStep(props: RegisteredStepProps) {
  const { children, activeStep, backgroundColor } = props;

  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const theme = useTheme();

  const {
    state: { accountType, submitSuccess },
  } = useContext(RegisteredContext);

  const pageTitle = useMemo(() => {
    return submitSuccess
      ? b3Lang(
          accountType === '1' ? 'register.title.registerComplete' : 'register.title.accountCreated',
        )
      : b3Lang('register.title.accountRegister');
  }, [submitSuccess, accountType, b3Lang]);

  const customColor = getContrastColor(backgroundColor);
  return (
    <Box
      component="div"
      sx={{
        width: isMobile ? '100%' : '537px',
        boxShadow:
          '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
        borderRadius: '4px',
        marginTop: '1rem',
        background: '#FFFFFF',
        padding: '0 0.8rem 1rem 0.8rem',
      }}
    >
      <Box
        component="h3"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          pt: 2,
          fontSize: '24px',
          fontWeight: '400',
          margin: '0.5rem 0',
          color: customColor,
        }}
      >
        {pageTitle}
      </Box>
      {!submitSuccess && (
        <Stepper
          activeStep={activeStep}
          sx={{
            '& .MuiSvgIcon-root:not(.Mui-active) .MuiStepIcon-text': {
              fill: getContrastColor(customColor),
            },
            '& .MuiSvgIcon-root.Mui-active .MuiStepIcon-text': {
              fill: getContrastColor(theme.palette.primary.main),
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{b3Lang(label)}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      {children}
    </Box>
  );
}
