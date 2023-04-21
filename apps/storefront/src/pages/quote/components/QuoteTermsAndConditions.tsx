import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material'

import {
  useState,
} from 'react'

import {
  B3CollapseContainer,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

interface QuoteTermsAndConditionsProps{
  quoteLegalTerms: string,
}

export const QuoteTermsAndConditions = (props: QuoteTermsAndConditionsProps) => {
  const {
    quoteLegalTerms = '',
  } = props

  const [isMobile] = useMobile()
  const [isOpen, setIsOpen] = useState(false)

  const handleOnChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Card
      sx={{
        '.MuiCardContent-root': {
          width: isMobile ? '343px' : '338px',
          height: isOpen ? '637px' : 'auto',
        },
      }}
    >
      <CardContent>
        <B3CollapseContainer
          title="Terms and conditions"
          handleOnChange={handleOnChange}
        >
          <Box>
            <Typography
              variant="body1"
              sx={{
                padding: '16px 0',
                width: '288px',
                height: '545px',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
              }}
            >
              {quoteLegalTerms}
            </Typography>
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
