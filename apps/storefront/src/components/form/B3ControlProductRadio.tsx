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
          src={getProductImageUrl(option.image?.data) || PRODUCT_DEFAULT_IMAGE}
          alt={option.image?.alt}
        />
        {option.label}
      </ProductImageContainer>
    ),
  }));

  // @ts-expect-error to be removed once ProductRadio types are rationalized
  return <B3ControlRadioGroup {...props} options={[NoneOption, ...newOptions]} />;
}
