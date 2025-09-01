import { ReactNode, useState } from 'react';
import styled from '@emotion/styled';
import { Box } from '@mui/material';

import { LoginConfig } from '../Login/config';

import RegisterComplete from './RegisterComplete';
import RegisteredAccount from './RegisteredAccount';
import RegisteredDetail from './RegisteredDetail';
import RegisteredFinish from './RegisteredFinish';

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

  const renderStep = (step: number): ReactNode => {
    switch (step) {
      case 0:
        return (
          <RegisteredAccount
            handleNext={(email) => {
              setEmail(email);
              handleNext();
            }}
          />
        );

      case 1:
        return <RegisteredDetail handleBack={handleBack} handleNext={handleNext} />;

      case 2:
        return (
          <RegisterComplete
            handleBack={handleBack}
            handleNext={(password) => {
              setPassword(password);
              handleNext();
            }}
          />
        );

      case 3:
        return <RegisteredFinish handleFinish={() => handleFinish({ email, password })} />;

      default:
        return null;
    }
  };

  return <StyledRegisterContent component="div">{renderStep(activeStep)}</StyledRegisterContent>;
}
