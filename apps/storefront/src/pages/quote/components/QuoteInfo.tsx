import {
  Box,
  Button,
  Typography,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  Container,
} from '../style'

interface GetValue {
  [key: string]: string,
}

interface InfoProps {
  contactInfo: GetValue,
  shippingAddress: GetValue,
  billingAddress: GetValue,
  handleEditInfoClick?: () => void,
}

type Keys = string | string[]

const contactInfoKeys: string[] = ['name', 'email', 'phoneNumber']

const addressKeys: Keys[] = ['label', ['firstName', 'lastName'], 'company', 'address', 'apartment', ['city', 'state', 'zipCode', 'country'], 'phoneNumber']

interface QuoteInfoItemProps {
  flag?: string,
  title: string,
  info: GetValue,
}

const QuoteInfoItem = ({
  flag,
  title,
  info,
}: QuoteInfoItemProps) => {
  const keyTable = flag === 'info' ? contactInfoKeys : addressKeys

  return (
    <Box sx={{
      width: '33.3%',
      paddingRight: '10px',
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
        {
            JSON.stringify(info) !== '{}' && keyTable.map((list: Keys) => {
              if (typeof list === 'string') {
                return (
                  <Typography
                    key={list}
                    variant="body1"
                  >
                    {info[list] || ''}
                  </Typography>
                )
              }

              return (
                <Typography
                  key={`${list}`}
                  variant="body1"
                >
                  {
                    list.map((item: string, index: number) => {
                      if (index === list.length - 1) {
                        return info[item] || ''
                      }
                      if (item === 'firstName') return `${info[item] || ''} `
                      return info[item] ? `${info[item] || ''}, ` : ''
                    })
                  }
                </Typography>
              )
            })
          }
      </Box>
    </Box>
  )
}

const QuoteInfo = ({
  contactInfo = {},
  shippingAddress = {},
  billingAddress = {},
  handleEditInfoClick,
}: InfoProps) => {
  const [isMobile] = useMobile()
  return (
    <Container
      flexDirection="column"
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <QuoteInfoItem
          title="Contact"
          flag="info"
          info={contactInfo}
        />

        <QuoteInfoItem
          title="Billing"
          info={billingAddress}
        />

        <QuoteInfoItem
          title="Shipping"
          info={shippingAddress}
        />
      </Box>
      {
        handleEditInfoClick && (
          <Button
            sx={{
              mt: '10px',
              mb: '15px',
            }}
            onClick={handleEditInfoClick}
            variant="outlined"
          >
            Edit info
          </Button>
        )
      }
    </Container>
  )
}

export default QuoteInfo
