import { useB3Lang } from '@b3/lang'
import { Box, Typography } from '@mui/material'

import { CustomButton } from '@/components'
import { useMobile } from '@/hooks'

import Container from '../style'

interface GetValue {
  [key: string]: string
}

interface InfoProps {
  contactInfo: GetValue
  shippingAddress: GetValue
  billingAddress: GetValue
  handleEditInfoClick?: () => void
  status?: string
}

type Keys = string | string[]

const contactInfoKeys: string[] = [
  'name',
  'email',
  'companyName',
  'phoneNumber',
]

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
]

const addressKeys: Keys[] = [
  'label',
  ['firstName', 'lastName'],
  'company',
  'address',
  'apartment',
  ['city', 'state', 'zipCode', 'country'],
  'phoneNumber',
]

interface QuoteInfoItemProps {
  flag?: string
  title: string
  info: GetValue
  status?: string
}

function QuoteInfoItem({ flag, title, info, status }: QuoteInfoItemProps) {
  const keyTable = flag === 'info' ? contactInfoKeys : addressKeys
  const [isMobile] = useMobile()

  const noAddresssText =
    status === 'Draft'
      ? `Please add ${flag === 'Billing' ? 'billing' : 'shipping'} address `
      : `No ${flag === 'Billing' ? 'billing' : 'shipping'} address`

  const isComplete =
    flag !== 'info'
      ? addressVerifyKeys.some((item: string) => !!info[item])
      : false

  const infoPaddingLeft = flag === 'info' || isMobile ? 0 : '10px'
  return (
    <Box
      sx={{
        width: isMobile ? '100%' : '33.3%',
        paddingLeft: infoPaddingLeft,
      }}
    >
      <Typography
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
            if (typeof list === 'string') {
              return (
                <Typography key={list} variant="body1">
                  {info[list] || ''}
                </Typography>
              )
            }

            return (
              <Typography key={`${list}`} variant="body1">
                {list.map((item: string, index: number) => {
                  if (index === list.length - 1) {
                    return info[item] || ''
                  }
                  if (item === 'firstName') return `${info[item] || ''} `
                  return info[item] ? `${info[item] || ''}, ` : ''
                })}
              </Typography>
            )
          })}

        {!isComplete && flag !== 'info' && <Box>{noAddresssText}</Box>}
      </Box>
    </Box>
  )
}

function QuoteInfo({
  contactInfo = {},
  shippingAddress = {},
  billingAddress = {},
  handleEditInfoClick,
  status,
}: InfoProps) {
  const b3Lang = useB3Lang()
  const [isMobile] = useMobile()
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
        <QuoteInfoItem title="Contact" flag="info" info={contactInfo} />

        <QuoteInfoItem
          title={b3Lang('global.quoteInfo.billing')}
          flag="Billing"
          status={status}
          info={billingAddress}
        />

        <QuoteInfoItem
          title={b3Lang('global.quoteInfo.shipping')}
          flag="Shipping"
          status={status}
          info={shippingAddress}
        />
      </Box>
      {handleEditInfoClick && (
        <CustomButton
          sx={{
            mt: '10px',
            mb: '15px',
          }}
          onClick={handleEditInfoClick}
          variant="outlined"
        >
          {b3Lang('global.quoteInfo.editInfo')}
        </CustomButton>
      )}
    </Container>
  )
}

export default QuoteInfo
