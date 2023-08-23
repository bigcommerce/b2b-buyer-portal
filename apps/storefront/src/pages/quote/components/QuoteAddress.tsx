import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import { Box, Typography } from '@mui/material'
import cloneDeep from 'lodash-es/cloneDeep'

import { B3CustomForm } from '@/components'
import { useGetCountry, useMobile } from '@/hooks'
import { AddressItemType } from '@/types/address'

import ChooseAddress from './ChooseAddress'

type AddressItemProps = {
  node: AddressItemType
}

interface AccountFormFieldsProps extends Record<string, any> {
  name: string
  label?: string
  required?: boolean
  fieldType?: string
  default?: string | Array<any> | number
  xs: number
  variant: string
  size: string
  options?: any[]
}

interface AddressProps {
  title: string
  pr?: string | number
  pl?: string | number
  addressList?: AddressItemProps[]
  info: {
    [key: string]: string
  }
  role: string | number
  accountFormFields: AccountFormFieldsProps[]
  shippingSameAsBilling: boolean
  type: string
  setBillingChange: (value: boolean) => void
}

export interface FormFieldsProps extends Record<string, any> {
  name: string
  label?: string
  required?: boolean
  fieldType?: string
  default?: string | Array<any> | number
  xs: number
  variant: string
  size: string
  options?: any[]
  replaceOptions?: {
    label: string
    value: string
  }
}

export interface Country {
  countryCode: string
  countryName: string
  id?: string
  states: []
}
export interface State {
  stateCode?: string
  stateName?: string
  id?: string
}

function QuoteAddress(
  {
    title,
    addressList = [],
    pr = 0,
    pl = 0,
    info = {},
    role,
    accountFormFields = [],
    shippingSameAsBilling = false,
    type,
    setBillingChange,
  }: AddressProps,
  ref: any
) {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const [isMobile] = useMobile()
  const b3Lang = useB3Lang()

  const [isOpen, setOpen] = useState<boolean>(false)
  const [quoteAddress, setQuoteAddress] = useState<AccountFormFieldsProps[]>(
    cloneDeep(accountFormFields)
  )

  useGetCountry({
    control,
    setValue,
    getValues,
    setAddress: setQuoteAddress,
    addresses: quoteAddress,
  })

  const getContactInfoValue = () => getValues()
  const setShippingInfoValue = (address: any) => {
    const addressKey = Object.keys(address)

    addressKey.forEach((item: string) => {
      if (item === 'company') return
      setValue(item, address[item])
    })
  }

  useImperativeHandle(ref, () => ({
    getContactInfoValue,
    setShippingInfoValue,
  }))

  const handleAddressChoose = () => {
    setOpen(true)
  }

  const handleCloseAddressChoose = () => {
    setOpen(false)
  }

  const handleChangeAddress = (address: AddressItemType) => {
    const addressItem: any = {
      label: address?.label || '',
      firstName: address?.firstName || '',
      lastName: address?.lastName || '',
      company: address?.company || '',
      country: address?.countryCode || '',
      address: address?.addressLine1 || '',
      apartment: address?.addressLine2 || '',
      city: address?.city || '',
      state: address?.state || '',
      zipCode: address?.zipCode || '',
      phoneNumber: address?.phoneNumber || '',
    }

    Object.keys(addressItem).forEach((item: string) => {
      if (item === 'company') return
      setValue(item, addressItem[item])
    })
    if (type === 'billing' && shippingSameAsBilling) {
      setBillingChange(true)
    }

    handleCloseAddressChoose()
  }

  useEffect(() => {
    if (JSON.stringify(info) !== '{}') {
      Object.keys(info).forEach((item: string) => {
        setValue(item, info[item])
      })
    }
  }, [info])

  return (
    <Box
      width={isMobile ? '100%' : '50%'}
      mt={isMobile ? '2rem' : '0'}
      pr={pr}
      pl={pl}
    >
      <Box
        sx={{
          display: 'flex',
          mb: '20px',
        }}
      >
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '24px',
            height: '32px',
            mr: '16px',
          }}
        >
          {title}
        </Typography>
        {+role !== 100 && (
          <Typography
            onClick={handleAddressChoose}
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'flex-end',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {b3Lang('quoteDraft.quoteAddress.chooseFromSaved')}
          </Typography>
        )}
      </Box>

      <B3CustomForm
        formFields={quoteAddress}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />

      <ChooseAddress
        isOpen={isOpen}
        handleChangeAddress={handleChangeAddress}
        closeModal={handleCloseAddressChoose}
        addressList={addressList}
        type={type}
      />
    </Box>
  )
}

export default forwardRef(QuoteAddress)
