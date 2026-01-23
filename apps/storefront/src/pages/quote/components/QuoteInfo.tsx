import { useId } from 'react';
import { Box, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import {
  BillingAddress,
  ContactInfo,
  QuoteInfoAndExtrafieldsItemProps,
  ShippingAddress,
} from '@/types/quotes';

import Container from '../style';

import QuoteInfoAndExtrafieldsItem from './QuoteInfoAndExtrafieldsItem';

type QuoteInfoItemType = Record<string, string>;

interface InfoProps {
  contactInfo: ContactInfo;
  quoteAndExtraFieldsInfo: QuoteInfoAndExtrafieldsItemProps;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  handleEditInfoClick?: () => void;
  status?: string;
}

type Keys = string | string[];

const contactInfoKeys: string[] = ['name', 'email', 'companyName', 'phoneNumber'];

const addressVerifyKeys: string[] = [
  'label',
  'firstName',
  'lastName',
  'company',
  'address',
  'apartment',
  'city',
  'state',
  'zipCode',
  'country',
  'phoneNumber',
];

const addressKeys: Keys[] = [
  'label',
  ['firstName', 'lastName'],
  'company',
  'address',
  'apartment',
  ['city', 'state', 'zipCode', 'country'],
  'phoneNumber',
];

interface QuoteInfoItemProps {
  flag?: string;
  title: string;
  info: QuoteInfoItemType;
  status?: string;
}

function QuoteInfoItem({ flag, title, info, status }: QuoteInfoItemProps) {
  const keyTable = flag === 'info' ? contactInfoKeys : addressKeys;
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const noAddressText =
    status === 'Draft'
      ? `Please add ${flag === 'Billing' ? 'billing' : 'shipping'} address `
      : `No ${flag === 'Billing' ? 'billing' : 'shipping'} address`;

  const isComplete =
    flag !== 'info' ? addressVerifyKeys.some((item: string) => info && Boolean(info[item])) : false;

  const infoPaddingLeft = flag === 'info' || isMobile ? 0 : '10px';
  const titleId = useId();

  return (
    <Box
      aria-labelledby={titleId}
      role="article"
      sx={{
        width: isMobile || flag === 'info' ? '100%' : '33.3%',
        paddingLeft: infoPaddingLeft,
      }}
    >
      <Typography
        id={titleId}
        sx={{
          fontWeight: 400,
          fontSize: '24px',
          height: '32px',
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          p: '15px 0',
        }}
      >
        {(isComplete || flag === 'info') &&
          JSON.stringify(info) !== '{}' &&
          keyTable.map((list: Keys) => {
            if (list === 'quoteTitle') {
              return status === 'Draft' ? (
                <Typography
                  key={list}
                  sx={{
                    wordBreak: 'break-all',
                  }}
                  variant="body1"
                >
                  {`${b3Lang('quoteDraft.quoteInfo.quoteTitle')}${info[list] || ''}`}
                </Typography>
              ) : (
                ''
              );
            }

            if (typeof list === 'string') {
              return (
                <Typography key={list} variant="body1">
                  {(info && info[list]) || ''}
                </Typography>
              );
            }

            return (
              <Typography key={`${list}`} variant="body1">
                {list.map((item: string, index: number) => {
                  if (index === list.length - 1) {
                    return info[item] || '';
                  }

                  if (item === 'firstName') {
                    return `${info[item] || ''} `;
                  }

                  return info[item] ? `${info[item] || ''}, ` : '';
                })}
              </Typography>
            );
          })}

        {!isComplete && flag !== 'info' && <Box>{noAddressText}</Box>}
      </Box>
    </Box>
  );
}

function QuoteInfo({
  quoteAndExtraFieldsInfo,
  contactInfo,
  shippingAddress,
  billingAddress,
  handleEditInfoClick,
  status,
}: InfoProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  return (
    <Container
      flexDirection="column"
      xs={{
        boxShadow:
          '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
        borderRadius: '4px',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : '33.3%',
          }}
        >
          <QuoteInfoItem
            flag="info"
            info={contactInfo as unknown as QuoteInfoItemType}
            status={status}
            title={b3Lang('quoteDraft.contactInfo.contact')}
          />
          <QuoteInfoAndExtrafieldsItem quoteInfo={quoteAndExtraFieldsInfo} status={status} />
        </Box>

        <QuoteInfoItem
          flag="Billing"
          info={billingAddress as unknown as QuoteInfoItemType}
          status={status}
          title={b3Lang('global.quoteInfo.billing')}
        />

        <QuoteInfoItem
          flag="Shipping"
          info={shippingAddress as unknown as QuoteInfoItemType}
          status={status}
          title={b3Lang('global.quoteInfo.shipping')}
        />
      </Box>
      {handleEditInfoClick && (
        <CustomButton
          onClick={handleEditInfoClick}
          sx={{
            mt: '10px',
            mb: '15px',
          }}
          variant="outlined"
        >
          {b3Lang('global.quoteInfo.editInfo')}
        </CustomButton>
      )}
    </Container>
  );
}

export default QuoteInfo;
