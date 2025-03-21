import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Box } from '@mui/material';

import RegisterComplete from './RegisterComplete';
import RegisteredAccount from './RegisteredAccount';
import RegisteredDetail from './RegisteredDetail';
import RegisteredFinish from './RegisteredFinish';

interface RegisterContentProps {
  activeStep: number;
  handleBack: () => void;
  handleNext: () => void;
  handleFinish: () => void;
}

export const StyledRegisterContent = styled(Box)({
  '& #b3-customForm-id-name': {
    '& label[data-shrink="true"]': {
      whiteSpace: 'break-spaces',
      minWidth: 'calc(133% - 24px)',
      transition: 'unset',
    },

    '& label[data-shrink="false"]': {
      whiteSpace: 'break-spaces',
    },
  },
});

export default function RegisterContent({
  activeStep,
  handleBack,
  handleNext,
  handleFinish,
}: RegisterContentProps) {
  const renderStep = (step: number): ReactNode => {
    switch (step) {
      case 0:
        return <RegisteredAccount handleNext={handleNext} />;

      case 1:
        return <RegisteredDetail handleBack={handleBack} handleNext={handleNext} />;

      case 2:
        return <RegisterComplete handleBack={handleBack} handleNext={handleNext} />;

      case 3:
        return <RegisteredFinish handleFinish={handleFinish} />;

      default:
        return null;
    }
  };

  return <StyledRegisterContent component="div">{renderStep(activeStep)}</StyledRegisterContent>;
}
