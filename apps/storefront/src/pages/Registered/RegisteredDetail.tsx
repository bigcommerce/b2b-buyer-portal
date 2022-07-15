import RegisteredStepButton from './component/RegisteredStepButton'

export default function RegisteredDetail(props: any) {
  const { handleBack, handleNext, activeStep } = props
  return (
    <div>
      Detail
      <RegisteredStepButton
        handleBack={handleBack}
        handleNext={handleNext}
        activeStep={activeStep}
      />
    </div>
  )
}
