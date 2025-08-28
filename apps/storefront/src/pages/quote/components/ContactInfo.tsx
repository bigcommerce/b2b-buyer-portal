import { Box } from '@mui/material';
import trim from 'lodash-es/trim';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';

import { B3CustomForm } from '@/components';
import { useMobile } from '@/hooks';
import { LangFormatFunction, useB3Lang } from '@/lib/lang';
import { validateQuoteExtraFields } from '@/shared/service/b2b';
import { isValidUserTypeSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
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
  recipients: string[] | undefined;
  handleSaveClick: (ccEmails: string[]) => void;
}

const emailValidate = validatorRules(['email']);

const getContactInfo = (isMobile: boolean, b3Lang: LangFormatFunction, isGuest: boolean) => {
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
      disabled: !isGuest,
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
      disabled: !isGuest,
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
    {
      name: 'companyName',
      label: b3Lang('quoteDraft.contactInfo.companyName'),
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
  recipients,
  handleSaveClick,
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
    {
      name: 'ccEmail',
      label: b3Lang('quoteDraft.contactInfo.ccEmail'),
      required: false,
      default: '',
      fieldType: 'multiInputText',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
      isEmail: true,
      existValue: recipients,
      validate: emailValidate,
      isEnterTrigger: true,
      handleSave: handleSaveClick,
    },
  ];

  return quoteInfo;
};

interface ContactInfoProps {
  info: ContactInfoType;
  quoteExtraFields: QuoteFormattedItemsProps[];
  emailAddress?: string;
  referenceNumber?: string | undefined;
  extraFieldsDefault: QuoteExtraFields[];
  recipients: string[] | undefined;
  handleSaveCCEmail: (ccEmail: string[]) => void;
}

function ContactInfo(
  {
    info,
    emailAddress,
    quoteExtraFields,
    referenceNumber,
    extraFieldsDefault,
    recipients,
    handleSaveCCEmail,
  }: ContactInfoProps,
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
  const role = useAppSelector(({ company }) => company.customer.role);
  const isGuest = role === CustomerRole.GUEST;

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

  const handleSaveClick = (ccEmails: string[]) => {
    handleSaveCCEmail(ccEmails);
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

  const contactInfo = getContactInfo(isMobile, b3Lang, isGuest);
  const quoteInfo = getQuoteInfo({
    isMobile,
    b3Lang,
    quoteExtraFields,
    referenceNumber,
    recipients,
    handleSaveClick,
  });

  const formData = [
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
      {formData.map((data) => (
        <Box key={data.title} width="100%">
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
            control={control}
            errors={errors}
            formFields={data.infos}
            getValues={getValues}
            setError={setError}
            setValue={setValue}
          />
        </Box>
      ))}
    </Box>
  );
}

export default forwardRef(ContactInfo);
