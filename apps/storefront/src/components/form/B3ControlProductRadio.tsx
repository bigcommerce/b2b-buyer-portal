import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import Form from './ui'

import {
  ProductImageContainer,
} from './styled'

import {
  B3ControlRadioGroup,
} from './B3ControlRadioGroup'

const NoneOption = {
  label: 'None',
  value: '',
}

export const B3ControlProductRadio = (props : Form.B3UIProps) => {
  const {
    options,
  } = props

  const getProductImageUrl = (url: string = '') => url.replace('{:size}', 'original')

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
  }))

  return (
    <B3ControlRadioGroup
      {...props}
      options={[NoneOption, ...newOptions]}
      fieldType="radio"
    />
  )
}
