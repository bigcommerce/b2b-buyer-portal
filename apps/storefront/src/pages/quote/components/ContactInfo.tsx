import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { LangFormatFunction, useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import trim from 'lodash-es/trim';

import { B3CustomForm } from '@/components';
import { useMobile } from '@/hooks';
import { validateQuoteExtraFields } from '@/shared/service/b2b';
import { isValidUserTypeSelector, useAppSelector } from '@/store';
import {
  ContactInfo as ContactInfoType,
  QuoteExtraFields,
  QuoteFormattedItemsProps,
} from '@/types/quotes';
import { validatorRules } from '@/utils';

export interface GetQuoteInfoProps {
  isMobile: boolean;
  b3Lang: LangFormatFunction;
  quoteExtraFields: QuoteFormattedItemsProps[];
  referenceNumber: string | undefined;
}

const emailValidate = validatorRules(['email']);

const getContactInfo = (isMobile: boolean, b3Lang: LangFormatFunction) => {
  const contactInfo = [
    {
      name: 'name',
      label: b3Lang('quoteDraft.contactInfo.contactPerson'),
      required: true,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'email',
      label: b3Lang('quoteDraft.contactInfo.email'),
      required: true,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
      validate: emailValidate,
    },
    {
      name: 'phoneNumber',
      label: b3Lang('quoteDraft.contactInfo.phone'),
      required: false,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
  ];

  return contactInfo;
};

const getQuoteInfo = ({
  isMobile,
  b3Lang,
  quoteExtraFields,
  referenceNumber,
}: GetQuoteInfoProps) => {
  const currentExtraFields = quoteExtraFields.map((field) => ({
    ...field,
    xs: isMobile ? 12 : 6,
  }));

  const quoteInfo = [
    {
      name: 'quoteTitle',
      label: b3Lang('quoteDraft.contactInfo.quoteTitle'),
      required: false,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'referenceNumber',
      label: b3Lang('quoteDraft.contactInfo.referenceNumber'),
      required: false,
      default: referenceNumber || '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    ...currentExtraFields,
  ];

  return quoteInfo;
};

interface ContactInfoProps {
  info: ContactInfoType;
  quoteExtraFields: QuoteFormattedItemsProps[];
  emailAddress?: string;
  referenceNumber?: string | undefined;
  extraFieldsDefault: QuoteExtraFields[];
}

function ContactInfo(
  { info, emailAddress, quoteExtraFields, referenceNumber, extraFieldsDefault }: ContactInfoProps,
  ref: any,
) {
  const {
    control,
    getValues,
    setError,
    formState: { errors },
    setValue,
    handleSubmit,
  } = useForm({
    mode: 'onSubmit',
  });

  const isValidUserType = useAppSelector(isValidUserTypeSelector);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  useEffect(() => {
    if (info && JSON.stringify(info) !== '{}') {
      Object.keys(info).forEach((item: string) => {
        setValue(item, info && info[item as keyof ContactInfoType]);
      });
    }

    if (extraFieldsDefault.length) {
      extraFieldsDefault.forEach((item) => {
        if (item.fieldName) setValue(item.fieldName, item.value);
      });
    }
    // Disable eslint exhaustive-deps rule for setValue dispatcher
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, extraFieldsDefault]);

  const validateEmailValue = async (emailValue: string) => {
    if (emailAddress === trim(emailValue)) return true;

    if (!isValidUserType) {
      setError('email', {
        type: 'custom',
        message: b3Lang('quoteDraft.contactInfo.emailExists'),
      });
    }

    return isValidUserType;
  };

  const validateQuoteExtraFieldsInfo = async () => {
    const values = getValues();
    const extraFields = quoteExtraFields.map((field) => ({
      fieldName: field.name,
      fieldValue: field.name ? values[field.name] : '',
    }));

    const res = await validateQuoteExtraFields({
      extraFields,
    });

    if (res.code !== 200) {
      const message = res.data?.errMsg || res.message || '';

      const messageArr = message.split(':');

      if (messageArr.length >= 2) {
        const field = quoteExtraFields?.find((field) => field.name === messageArr[0]);
        if (field && field.name) {
          setError(field.name, {
            type: 'manual',
            message: messageArr[1],
          });

          return false;
        }
      }
      return false;
    }
    return true;
  };

  const getContactInfoValue = async () => {
    let isValid = true;
    await handleSubmit(
      async (data) => {
        isValid = await validateEmailValue(data.email);
      },
      () => {
        isValid = false;
      },
    )();

    if (isValid) {
      isValid = await validateQuoteExtraFieldsInfo();
    }

    return isValid ? getValues() : isValid;
  };

  useImperativeHandle(ref, () => ({
    getContactInfoValue,
  }));

  const contactInfo = getContactInfo(isMobile, b3Lang);
  const quoteInfo = getQuoteInfo({ isMobile, b3Lang, quoteExtraFields, referenceNumber });

  const formDatas = [
    {
      title: b3Lang('quoteDraft.contactInfo.contact'),
      infos: contactInfo,
    },
    {
      title: b3Lang('quoteDraft.quoteInfo.title'),
      infos: quoteInfo,
      style: {
        mt: '20px',
      },
    },
  ];

  return (
    <Box width="100%">
      {formDatas.map((data) => (
        <>
          <Box
            sx={{
              fontWeight: 400,
              fontSize: '24px',
              height: '32px',
              mb: '20px',
              ...data?.style,
            }}
          >
            {data.title}
          </Box>

          <B3CustomForm
            formFields={data.infos}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </>
      ))}
    </Box>
  );
}

export default forwardRef(ContactInfo);
