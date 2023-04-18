import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material'

import {
  B3CollapseContainer,
} from '@/components'

interface QuoteTermsAndConditionsProps{
  quoteLegalTerms: string,
}

export const QuoteTermsAndConditions = (props: QuoteTermsAndConditionsProps) => {
  const {
    quoteLegalTerms = '',
  } = props

  return (
    <Card>
      <CardContent>
        <B3CollapseContainer
          title="Terms and conditions"
        >
          <Box sx={{
            padding: '16px 0',
            width: '288px',
            height: '545px',
            whiteSpace: 'pre-line',
            overflow: 'auto',
          }}
          >
            <Typography
              variant="body1"
            >
              {quoteLegalTerms}
            </Typography>
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
