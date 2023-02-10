import {
  useState,
  useEffect,
} from 'react'

import {
  useMobile,
} from '@/hooks'

import {
  StyledNumberTextField,
} from './styled'

interface B3NumberTextFieldProps{
  disabled?: boolean,
  label?: string,
  value?: number | string,
  maxQuantity?: number,
  minQuantity?: number,
  isStock?: string,
  stock?: number,
  hiddenLabel?: boolean,
  onChange?: (value: number | string, isValid: boolean) => void,
  sx?: CustomFieldItems,
}

export const B3QuantityTextField = (props: B3NumberTextFieldProps) => {
  const [isMobile] = useMobile()

  const {
    disabled = false,
    label = isMobile ? 'Qty' : '',
    value = '',
    maxQuantity = 0,
    minQuantity = 0,
    isStock = '0',
    stock = 0,
    hiddenLabel = !isMobile,
    onChange = () => {},
    sx = {
      width: isMobile ? '60%' : '100%',
      '& .MuiFormHelperText-root': {
        marginLeft: '0',
        marginRight: '0',
      },
    },
  } = props

  const [validMessage, setValidMessage] = useState('')

  const validateQuantity = (value: number | string) => {
    const quantity = parseInt(`${value}`, 10) || 0

    let validMessage = ''

    if (isStock === '1' && stock === 0) {
      validMessage = ('Out of stock')
    } else if (isStock === '1' && quantity > stock) {
      validMessage = (`${stock} in stock`)
    } else if (minQuantity !== 0 && quantity < minQuantity) {
      validMessage = (`Min is ${minQuantity}`)
    } else if (maxQuantity !== 0 && quantity > maxQuantity) {
      validMessage = (`Max is ${maxQuantity}`)
    }

    setValidMessage(validMessage)

    return validMessage
  }

  const handleChange = (value: string) => {
    onChange(value, !!validMessage)
  }

  const handleBlur = () => {
    const quantity = parseInt(`${value}`, 10) || 0

    onChange(quantity, !validateQuantity(quantity))
  }

  useEffect(() => {
    validateQuantity(value)
  }, [value])

  return (
    <StyledNumberTextField
      size="small"
      type="number"
      variant="filled"
      disabled={disabled}
      hiddenLabel={hiddenLabel}
      label={label}
      value={value}
      error={!!validMessage}
      helperText={validMessage}
      inputProps={{
        inputMode: 'numeric', pattern: '[0-9]*',
      }}
      onChange={(e) => {
        handleChange(e.target.value)
      }}
      onBlur={() => {
        handleBlur()
      }}
      sx={sx}
    />
  )
}
