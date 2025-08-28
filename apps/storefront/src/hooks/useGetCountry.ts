import { useContext, useEffect } from 'react';
import { Control, FieldValues, UseFormGetValues, UseFormSetValue, useWatch } from 'react-hook-form';

import { GlobalContext } from '@/shared/global';
import { Country, State } from '@/shared/global/context/config';
import { getB2BCountries } from '@/shared/service/b2b';

const useSetCountry = () => {
  const {
    state: { countriesList },
    dispatch,
  } = useContext(GlobalContext);

  useEffect(() => {
    const init = async () => {
      if (countriesList && !countriesList.length) {
        const { countries } = await getB2BCountries();

        dispatch({
          type: 'common',
          payload: {
            countriesList: countries,
          },
        });
      }
    };

    init();
    // ignore dispatch, it's not affecting any value from this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesList]);
};

interface FormFieldsProps extends Record<string, any> {
  name: string;
  label?: string;
  required?: boolean;
  fieldType?: string;
  default?: string | Array<any> | number;
  xs: number;
  variant: string;
  size: string;
  options?: any[];
}

interface GetCountryProps {
  setAddress: (arr: FormFieldsProps[]) => void;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  addresses: FormFieldsProps[];
  control: Control;
}

const useGetCountry = ({
  setAddress,
  setValue,
  getValues,
  control,
  addresses,
}: GetCountryProps) => {
  const {
    state: { countriesList },
  } = useContext(GlobalContext);

  const countryCode = useWatch({
    control,
    name: 'country',
  });

  // Populate country array
  useEffect(() => {
    const countriesFieldIndex = addresses.findIndex(
      (formFields: FormFieldsProps) => formFields.name === 'country',
    );

    if (countriesList?.length && countriesFieldIndex !== -1) {
      setAddress(
        addresses.map((addressField, addressFieldIndex) => {
          if (countriesFieldIndex === addressFieldIndex) {
            return { ...addressField, options: countriesList };
          }

          return addressField;
        }),
      );
    }
    // ignore addresses cause it will trigger loop array
    // ignore setAddress due it's no affecting any logic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesList]);

  // Populate state array when the user change selected country
  useEffect(() => {
    if (!countryCode || !countriesList?.length) return;

    const stateList =
      countriesList.find((country: Country) => country.countryCode === countryCode)?.states || [];
    const stateFieldIndex = addresses.findIndex(
      (formFields: FormFieldsProps) => formFields.name === 'state',
    );

    if (stateFieldIndex !== -1) {
      setAddress(
        addresses.map((addressField, addressFieldIndex) => {
          if (stateFieldIndex === addressFieldIndex) {
            if (stateList.length > 0) {
              return {
                ...addressField,
                fieldType: 'dropdown',
                options: stateList,
                required: true,
              };
            }

            return { ...addressField, fieldType: 'text', options: [], required: false };
          }

          return addressField;
        }),
      );
    }

    const stateVal = getValues('state');

    setValue(
      'state',
      stateVal &&
        countryCode &&
        (stateList.find((state: State) => state.stateName === stateVal) || stateList.length === 0)
        ? stateVal
        : '',
    );
    // ignore addresses cause it will trigger loop array
    // ignore setAddress, getValues and setValue due they're not affecting any value from this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, countriesList]);
};

export { useGetCountry, useSetCountry };
