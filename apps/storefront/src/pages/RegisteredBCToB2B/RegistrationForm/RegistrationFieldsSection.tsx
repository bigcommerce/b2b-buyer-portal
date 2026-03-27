import type {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
} from 'react-hook-form';
import { Box } from '@mui/material';

import { B3CustomForm } from '@/components/B3CustomForm';
import type { RegisterFields } from '@/pages/Registered/types';

import { InformationFourLabels } from '../styled';

interface RegistrationFieldsSectionProps {
  formFields: RegisterFields[];
  sectionHeading: string;
  control: Control<CustomFieldItems>;
  errors: FieldErrors<CustomFieldItems>;
  getValues: UseFormGetValues<CustomFieldItems>;
  setValue: UseFormSetValue<CustomFieldItems>;
  /** Required when the section includes file upload fields (e.g. Business Details). */
  setError?: UseFormSetError<CustomFieldItems>;
}

export function RegistrationFieldsSection({
  formFields,
  sectionHeading,
  control,
  errors,
  getValues,
  setValue,
  setError,
}: RegistrationFieldsSectionProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <InformationFourLabels>{sectionHeading}</InformationFourLabels>
      <B3CustomForm
        formFields={formFields}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
        {...(setError !== undefined ? { setError } : {})}
      />
    </Box>
  );
}
