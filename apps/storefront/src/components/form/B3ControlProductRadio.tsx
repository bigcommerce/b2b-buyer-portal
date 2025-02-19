import { FieldValues } from 'react-hook-form';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';

import B3ControlRadioGroup, { RadioGroupFieldProps } from './B3ControlRadioGroup';
import { ProductImageContainer } from './styled';

const NoneOption = {
  label: 'None',
  value: '',
};

export type ProductRadioProps<T extends FieldValues> = RadioGroupFieldProps<T>;

export default function B3ControlProductRadio<T extends FieldValues>(props: ProductRadioProps<T>) {
  const { options } = props;

  const getProductImageUrl = (url = '') => url.replace('{:size}', 'original');

  const newOptions = options.map((option) => ({
    ...option,
    label: (
      <ProductImageContainer>
        <img
          src={getProductImageUrl(option.image?.data) || PRODUCT_DEFAULT_IMAGE}
          alt={option.image?.alt}
        />
        {option.label}
      </ProductImageContainer>
    ),
  }));

  return <B3ControlRadioGroup {...props} options={[NoneOption, ...newOptions]} />;
}
