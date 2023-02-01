import {
  useEffect,
  useContext,
} from 'react'

import {
  useWatch,
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form'
import {
  getB2BCountries,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  State,
  Country,
} from '@/shared/global/context/config'

const useSetCountry = () => {
  const {
    state: {
      countriesList,
    },
    dispatch,
  } = useContext(GlobaledContext)

  useEffect(() => {
    const init = async () => {
      if (countriesList && !countriesList.length) {
        const {
          countries,
        } = await getB2BCountries()

        dispatch({
          type: 'common',
          payload: {
            countriesList: countries,
          },
        })
      }
    }
    init()
  }, [])
}

interface FormFieldsProps extends Record<string, any> {
  name: string,
  label?: string,
  required?: Boolean,
  fieldType?: string,
  default?: string | Array<any> | number,
  xs: number,
  variant: string,
  size: string,
  options?: any[],
}

interface GetCountryProps {
  setAddress: (arr: FormFieldsProps[]) => void,
  setValue: UseFormSetValue<FieldValues>,
  getValues: UseFormGetValues<FieldValues>,
  addresses: FormFieldsProps[],
  control: Control,
}

const useGetCountry = ({
  setAddress,
  setValue,
  getValues,
  control,
  addresses,
}: GetCountryProps) => {
  const {
    state: {
      countriesList,
    },
  } = useContext(GlobaledContext)

  const country = useWatch({
    control,
    name: 'country',
  })

  const handleCountryChange = (countryCode: string) => {
    if (countriesList && countriesList.length && countryCode) {
      const stateList = countriesList.find((country: Country) => country.countryCode === countryCode)?.states || []
      const stateFields = addresses.find((formFields: FormFieldsProps) => formFields.name === 'state')
      if (stateFields) {
        if (stateList.length > 0) {
          stateFields.fieldType = 'dropdown'
          stateFields.options = stateList
        } else {
          stateFields.fieldType = 'text'
          stateFields.options = []
        }
      }

      const stateVal = getValues('state')

      setValue('state', stateVal && countryCode && (stateList.find((state: State) => state.stateName === stateVal) || stateList.length === 0) ? stateVal : '')

      setAddress([...addresses])
    }
  }

  useEffect(() => {
    const countryFields = addresses.find((formFields: FormFieldsProps) => formFields.name === 'country')
    if (countriesList?.length && countryFields && !countryFields?.options?.length) {
      countryFields.options = countriesList
      setAddress([...addresses])
    }
  }, [countriesList])

  useEffect(() => {
    if (countriesList && countriesList.length) {
      handleCountryChange(country)
    }
  }, [country])
}

export {
  useSetCountry,
  useGetCountry,
}
