import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoginConfig } from '../../Login/config';

import AccountStep from './steps/AccountStep';
import CompleteStep from './steps/CompleteStep';
import DetailStep from './steps/DetailStep';
import FinishStep from './steps/FinishStep';
import { StyledRegisterContent } from './styled';

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
            handleNext={(email) => {
              setEmail(email);
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
            handleNext={(password) => {
              setPassword(password);
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
