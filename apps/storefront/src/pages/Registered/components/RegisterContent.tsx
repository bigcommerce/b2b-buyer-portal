import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Box } from '@mui/material';

import { LoginConfig } from '../../Login/config';

import AccountStep from './steps/AccountStep';
import CompleteStep from './steps/CompleteStep';
import DetailStep from './steps/DetailStep';
import FinishStep from './steps/FinishStep';

const StyledRegisterContent = styled(Box)({
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

interface RegisterContentProps {
  activeStep: number;
  handleBack: () => void;
  handleNext: () => void;
  handleFinish: ({ email, password }: LoginConfig) => void;
}

export default function RegisterContent({
  activeStep,
  handleBack,
  handleNext,
  handleFinish,
}: RegisterContentProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleFinishClick = (shouldAutoLogin: boolean) => {
    if (shouldAutoLogin) {
      handleFinish({ email, password });
    } else {
      navigate('/login');
    }
  };

  const renderStep = (step: number): ReactNode => {
    switch (step) {
      case 0:
        return (
          <AccountStep
            handleNext={(emailValue) => {
              setEmail(emailValue);
              handleNext();
            }}
          />
        );

      case 1:
        return <DetailStep handleBack={handleBack} handleNext={handleNext} />;

      case 2:
        return (
          <CompleteStep
            handleBack={handleBack}
            handleNext={(passwordValue) => {
              setPassword(passwordValue);
              handleNext();
            }}
          />
        );

      case 3:
        return <FinishStep handleFinish={handleFinishClick} />;

      default:
        return null;
    }
  };

  return <StyledRegisterContent component="div">{renderStep(activeStep)}</StyledRegisterContent>;
}
