import type {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
} from 'react-hook-form';

import { B3CustomForm } from '@/components/B3CustomForm';
import type { RegisterFields } from '@/pages/Registered/types';

import { InformationFourLabels } from '../styled';

import { FormSection } from './FormSection';

interface BusinessDetailsProps {
  formFields: RegisterFields[];
  sectionHeading: string;
  control: Control<CustomFieldItems>;
  errors: FieldErrors<CustomFieldItems>;
  getValues: UseFormGetValues<CustomFieldItems>;
  setValue: UseFormSetValue<CustomFieldItems>;
  setError: UseFormSetError<CustomFieldItems>;
}

export function BusinessDetails({
  formFields,
  sectionHeading,
  control,
  errors,
  getValues,
  setValue,
  setError,
}: BusinessDetailsProps) {
  return (
    <FormSection>
      <InformationFourLabels>{sectionHeading}</InformationFourLabels>
      <B3CustomForm
        formFields={formFields}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
        setError={setError}
      />
    </FormSection>
  );
}
