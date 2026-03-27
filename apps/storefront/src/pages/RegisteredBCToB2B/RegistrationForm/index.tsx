import { Alert } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

import { InformationLabels, StyledRegisterContent, TipContent } from '../styled';

import { RegistrationFieldsSection } from './RegistrationFieldsSection';
import { SubmitRow } from './SubmitRow';
import { useRegistrationForm } from './useRegistrationForm';

interface RegistrationFormProps {
  onRegistrationSuccess: () => void;
}

export default function RegistrationForm({ onRegistrationSuccess }: RegistrationFormProps) {
  const b3Lang = useB3Lang();
  const {
    isMobile,
    errorMessage,
    bcTob2bContactInformation,
    bcTob2bCompanyInformation,
    bcTob2bCompanyExtraFields,
    bcTob2bAddressBasicFields,
    control,
    errors,
    getValues,
    setValue,
    setError,
    handleNext,
  } = useRegistrationForm({ onRegistrationSuccess });

  return (
    <StyledRegisterContent
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
      <InformationLabels>{b3Lang('registeredbctob2b.title')}</InformationLabels>

      {errorMessage && (
        <Alert severity="error">
          <TipContent>{errorMessage}</TipContent>
        </Alert>
      )}

      <RegistrationFieldsSection
        formFields={bcTob2bContactInformation || []}
        sectionHeading={
          bcTob2bContactInformation?.length ? (bcTob2bContactInformation[0]?.groupName ?? '') : ''
        }
        control={control}
        errors={errors}
        getValues={getValues}
        setValue={setValue}
      />

      <RegistrationFieldsSection
        formFields={[...bcTob2bCompanyInformation, ...bcTob2bCompanyExtraFields]}
        sectionHeading={
          bcTob2bCompanyInformation?.length ? (bcTob2bCompanyInformation[0]?.groupName ?? '') : ''
        }
        control={control}
        errors={errors}
        getValues={getValues}
        setValue={setValue}
        setError={setError}
      />

      <RegistrationFieldsSection
        formFields={bcTob2bAddressBasicFields}
        sectionHeading={
          bcTob2bAddressBasicFields?.length ? (bcTob2bAddressBasicFields[0]?.groupName ?? '') : ''
        }
        control={control}
        errors={errors}
        getValues={getValues}
        setValue={setValue}
      />

      <SubmitRow onSubmit={handleNext} />
    </StyledRegisterContent>
  );
}
