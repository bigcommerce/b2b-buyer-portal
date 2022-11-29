import {
  useEffect,
  useContext,
  useState,
  forwardRef,
  useImperativeHandle,
  Ref,
} from 'react'

import {
  useForm,
} from 'react-hook-form'

import {
  cloneDeep,
} from 'lodash'

import {
  styled,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  B3CustomForm,
  B3Dialog,
} from '@/components'

import {
  b2bShippingBilling,
} from '../shared/config'

import {
  snackbar,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  snackbar,
} from '@/utils'

import {
  updateB2BAddress,
  createB2BAddress,
  getB2BCountries,
  createBcAddress,
  updateBcAddress,
  validateAddressExtraFields,
} from '@/shared/service/b2b'

import {
  deCodeField,
} from '../../registered/config'

const StyledCheckbox = styled('div')(() => ({
  display: 'flex',

  '& div::first-of-type': {
    marginRight: '2rem',
  },

  '& div': {
    minWidth: '45%',
    display: 'flex',
    flexDirection: 'column',
  },
}))

const AddressForm = ({
  addressFields,
  updateAddressList,
  companyId,
  isBCPermission,
}: any, ref: Ref<unknown> | undefined) => {
  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')
  const [countries, setCountries] = useState<any>([])
  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false)
  const [allAddressFields, setAllAddressFields] = useState<any>(addressFields)
  const [addressExtraFields, setAddressExtraFields] = useState<any>({})
  const [originAddressFields, setOriginAddressFields] = useState<any>([])
  const [addressData, setAddressData] = useState<any>({})
  const [shippingBilling, setShippingBilling] = useState<any>({
    isShipping: false,
    isBilling: false,
    isDefaultShipping: false,
    isDefaultBilling: false,
  })

  const isB2BUser = !isBCPermission

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    watch,
    setError,
    setValue,
    reset,
  } = useForm({
    mode: 'all',
  })

  const validateCompanyExtraFieldsUnique = async (data: CustomFieldItems) => {
    try {
      const extraFields = addressExtraFields.map((field: any) => ({
        fieldName: deCodeField(field.name),
        fieldValue: data[field.name] || field.default,
      }))

      const res = await validateAddressExtraFields({
        extraFields,
      })

      if (res.code !== 200) {
        const message = res.data?.errMsg || res.message || ''

        const messageArr = message.split(':')

        if (messageArr.length >= 2) {
          const field = addressExtraFields.find(((field: any) => deCodeField(field.name) === messageArr[0]))
          if (field) {
            setError(
              field.name,
              {
                type: 'manual',
                message: messageArr[1],
              },
            )
            setAddUpdateLoading(false)
            return false
          }
        }
        throw message
      }

      return true
    } catch (error: any) {
      snackbar.error(error)
      throw error
    }
  }

  const handleCancelClick = () => {
    reset()
    setOpen(false)
    setType('')
  }

  const handleSaveB2BAddress = (event: any) => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true)

      try {
        const isValidate = await validateCompanyExtraFieldsUnique(data)
        if (!isValidate) {
          return
        }

        const extraFields = addressExtraFields.map((field: any) => ({
          fieldName: deCodeField(field.name),
          fieldValue: data[field.name] || field.default,
        }))
        const {
          country: currentCountryCode,
          state: stateCode,
        } = data

        let currentCountryName = ''
        let currentStateName = ''
        let currentStateCode = stateCode

        countries.forEach((country: any) => {
          const {
            countryName,
            countryCode,
            states,
          } = country
          if (countryCode === currentCountryCode) {
            currentCountryName = countryName

            if (states.length > 0) {
              const state = states.filter((item: any) => item.stateCode === currentStateCode)
              currentStateName = state.stateName || currentStateCode
              currentStateCode = state.stateCode || currentStateCode
            } else {
              currentStateCode = ''
              currentStateName = stateCode
            }
          }
        })

        // To Do:
        const params = {
          ...data,
          companyId: +companyId,
          extraFields,
          isShipping: shippingBilling.isShipping ? 1 : 0,
          isBilling: shippingBilling.isBilling ? 1 : 0,
          isDefaultShipping: shippingBilling.isDefaultShipping ? 1 : 0,
          isDefaultBilling: shippingBilling.isDefaultBilling ? 1 : 0,
          country: currentCountryName,
          countryCode: currentCountryCode,
          state: currentStateName,
          stateCode: currentStateCode,
        }

        if (type === 'add') {
          await createB2BAddress(params)
          snackbar.success('New address is added')
        } else if (type === 'edit') {
          const {
            id,
          } = addressData

          await updateB2BAddress({
            ...params,
            id: +id,
          })

          snackbar.success('Address updated successfully')
        }
        setOpen(false)

        await updateAddressList(true)
      } catch (err: any) {
        snackbar.error(err)
      } finally {
        setAddUpdateLoading(false)
      }
    })(event)
  }

  const handleSaveBcAddress = (event: any) => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true)
      try {
        const extraFields = addressExtraFields.map((field: any) => ({
          name: field.bcLabel,
          value: data[field.name] || field.default,
        }))

        const {
          country: currentCountryCode,
          state: stateCode,
        } = data

        let currentCountryName = ''
        let currentStateName = ''
        let currentStateCode = stateCode

        countries.forEach((country: any) => {
          const {
            countryName,
            countryCode,
            states,
          } = country
          if (countryCode === currentCountryCode) {
            currentCountryName = countryName

            if (states.length > 0) {
              const state = states.filter((item: any) => item.stateCode === currentStateCode)
              currentStateName = state.stateName || currentStateCode
              currentStateCode = state.stateCode || currentStateCode
            } else {
              currentStateCode = ''
              currentStateName = stateCode
            }
          }
        })

        const params = {
          ...data,
          formFields: extraFields,
          country: currentCountryName,
          countryCode: currentCountryCode,
          state: currentStateName,
          stateCode: currentStateCode,
          addressType: '',
        }

        if (type === 'add') {
          await createBcAddress(params)
          snackbar.success('New address is added')
        } else if (type === 'edit') {
          const {
            bcAddressId,
          } = addressData

          await updateBcAddress({
            ...params,
            id: +bcAddressId,
          })
          snackbar.success('Address updated successfully')
        }
        setOpen(false)

        await updateAddressList(true)
      } catch (err: any) {
        snackbar.error(err)
      } finally {
        setAddUpdateLoading(false)
      }
    })(event)
  }

  const handleSaveAddress = (event: any) => {
    if (isB2BUser) {
      handleSaveB2BAddress(event)
    } else {
      handleSaveBcAddress(event)
    }
  }

  const handleOpenAddEditAddressClick = (type: string, data: any) => {
    if (type === 'add' && originAddressFields.length > 0) {
      allAddressFields.forEach((field: any) => {
        if (field.custom) {
          if (isB2BUser) {
            const originFields = originAddressFields.filter((item: any) => item.name === field.name)[0]
            field.default = originFields.default || ''
          } else {
            const originFields = originAddressFields.filter((item: any) => item.name === field.name || item.bcLabel === field.bcLabel)[0]
            field.default = originFields.default || ''
          }
        }
      })
    }

    reset()
    setAddressData(data)
    setType(type)
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    handleOpenAddEditAddressClick,
  }))

  const handleBackFillData = () => {
    const {
      isShipping,
      isBilling,
      isDefaultShipping,
      isDefaultBilling,
      state,
      stateCode,
      countryCode,
      extraFields,
    } = addressData

    const currentCountry = countries.filter((country: any) => country.countryCode === countryCode)

    setShippingBilling({
      isShipping: isShipping === 1,
      isBilling: isBilling === 1,
      isDefaultShipping: isDefaultShipping === 1,
      isDefaultBilling: isDefaultBilling === 1,
    })

    allAddressFields.forEach((field: any) => {
      if (field.custom && extraFields.length > 0) {
        if (isB2BUser) {
          const name = deCodeField(field.name)
          const currentExtraField = extraFields.filter((item: any) => item.fieldName === name)[0]
          const originFields = originAddressFields.filter((item: any) => item.name === name)[0]

          if (currentExtraField) {
            setValue(field.name, currentExtraField.fieldValue || '')

            field.default = currentExtraField.fieldValue || ''
          } else {
            setValue(field.name, '')
            field.default = originFields.default
          }
        } else {
          const currentExtraField = extraFields.filter((item: any) => item.fieldName === field.name || item.fieldName === field.bcLabel)[0]
          const originFields = originAddressFields.filter((item: any) => item.name === field.name || item.bcLabel === field.bcLabel)[0]

          if (currentExtraField) {
            setValue(field.name, currentExtraField.fieldValue || '')

            field.default = currentExtraField.fieldValue || originFields.default
          } else {
            setValue(field.name, '')
            field.default = originFields.default
          }
        }
      } else if (field.name === 'country') {
        setValue(field.name, countryCode)
      } else if (field.name === 'state') {
        setValue(field.name, stateCode || state)
        if (currentCountry.length > 0) {
          const {
            states,
          } = currentCountry[0]

          if (states.length > 0) {
            field.options = states
            field.fieldType = 'dropdown'
          } else {
            field.options = []
            field.fieldType = 'text'
          }
        }
      } else {
        setValue(field.name, addressData[field.name])
      }
    })
  }

  const handleCountryChange = (countryCode: string) => {
    const stateList = countries.find((country: any) => country.countryCode === countryCode)?.states || []
    const stateFields = allAddressFields.find((formFields: any) => formFields.name === 'state')

    if (stateFields) {
      if (stateList.length > 0) {
        stateFields.fieldType = 'dropdown'
        stateFields.options = stateList
      } else {
        stateFields.fieldType = 'text'
        stateFields.options = []
      }
    }

    setValue('state', '')

    setAllAddressFields([...allAddressFields])
  }

  const handleChangeAddressType = (check: boolean, name: string) => {
    if (name === 'isShipping') {
      setShippingBilling({
        ...shippingBilling,
        [name]: check,
        isDefaultShipping: false,
      })
    } else {
      setShippingBilling({
        ...shippingBilling,
        [name]: check,
        isDefaultBilling: false,
      })
    }
  }

  const getCountries = async () => {
    try {
      const {
        countries,
      } = await getB2BCountries()

      setCountries(countries)
    } catch (e: any) {
      snackbar.error(e)
    }
  }

  useEffect(() => {
    getCountries()
  }, [])

  useEffect(() => {
    setAllAddressFields(addressFields)
    const extraFields = addressFields.filter((field: any) => field.custom)

    setAddressExtraFields(extraFields)

    if (originAddressFields.length === 0) {
      const fields = cloneDeep(addressFields)
      setOriginAddressFields(fields)
    }
  }, [addressFields])

  useEffect(() => {
    if (open && type === 'edit' && addressData) {
      handleBackFillData()
    }
  }, [open, type])

  useEffect(() => {
    const subscription = watch((value, {
      name,
      type,
    }) => {
      const {
        country,
      } = value

      if (name === 'country' && type === 'change') {
        handleCountryChange(country)
      }
    })
    return () => subscription.unsubscribe()
  }, [allAddressFields])

  return (
    <>
      <B3Dialog
        isOpen={open}
        title={type === 'create' ? 'Add new address' : 'Edit address'}
        leftSizeBtn="Cancel"
        rightSizeBtn="Save Address"
        handleLeftClick={handleCancelClick}
        handRightClick={handleSaveAddress}
        loading={addUpdateLoading}
      >
        {
          isB2BUser && (
            <>
              <p>Select address type</p>

              <StyledCheckbox>
                {
                  b2bShippingBilling.map((item: any) => {
                    const {
                      child,
                      name,
                      label,
                    } = item

                    return (
                      <div key={name}>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              checked={shippingBilling[name]}
                              onChange={(e) => {
                                handleChangeAddressType(e.target.checked, name)
                              }}
                            />
                          )}
                          label={label}
                        />
                        {
                          child && (
                            <FormControlLabel
                              control={(
                                <Checkbox
                                  checked={shippingBilling[child.name]}
                                  onChange={() => {
                                    setShippingBilling({
                                      ...shippingBilling,
                                      [child.name]: !shippingBilling[child.name],
                                    })
                                  }}
                                />
                              )}
                              label={child.label}
                              sx={{
                                display: shippingBilling[name] ? '' : 'none',
                              }}
                            />
                          )
                        }
                      </div>
                    )
                  })
                }
              </StyledCheckbox>
            </>
          )
        }
        <B3CustomForm
          formFields={allAddressFields}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

      </B3Dialog>
    </>
  )
}

const B3AddressForm = forwardRef(AddressForm)

export default B3AddressForm
