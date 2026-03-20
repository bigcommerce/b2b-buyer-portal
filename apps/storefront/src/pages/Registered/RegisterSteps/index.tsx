import { LoginConfig } from '../../Login/config';

import RegisterContent from './RegisterContent';
import RegisterStep from './RegisterStep';

interface RegisterStepsProps {
  activeStep: number;
  backgroundColor: string;
  handleBack: () => void;
  handleNext: () => void;
  handleFinish: (config: LoginConfig) => void;
}

export function RegisterSteps({
  activeStep,
  backgroundColor,
  handleBack,
  handleNext,
  handleFinish,
}: RegisterStepsProps) {
  return (
    <RegisterStep activeStep={activeStep} backgroundColor={backgroundColor}>
      <RegisterContent
        activeStep={activeStep}
        handleBack={handleBack}
        handleNext={handleNext}
        handleFinish={handleFinish}
      />
    </RegisterStep>
  );
}
