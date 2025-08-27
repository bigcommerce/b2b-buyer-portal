import { PRODUCT_DEFAULT_IMAGE } from '@/constants';

import B3ControlRadioGroup from './B3ControlRadioGroup';
import { ProductImageContainer } from './styled';
import Form from './ui';

const NoneOption = {
  label: 'None',
  value: '',
};

export default function B3ControlProductRadio(props: Form.B3UIProps) {
  const { options } = props;

  const getProductImageUrl = (url = '') => url.replace('{:size}', 'original');

  const newOptions = options.map((option: Form.ProductRadioGroupListProps) => ({
    ...option,
    label: (
      <ProductImageContainer>
        <img
          alt={option.image?.alt}
          src={getProductImageUrl(option.image?.data) || PRODUCT_DEFAULT_IMAGE}
        />
        {option.label}
      </ProductImageContainer>
    ),
  }));

  return <B3ControlRadioGroup {...props} fieldType="radio" options={[NoneOption, ...newOptions]} />;
}
