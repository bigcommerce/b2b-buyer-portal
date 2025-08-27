import { useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { B3CollapseContainer } from '@/components';
import { useB3Lang } from '@/lib/lang';

interface QuoteTermsAndConditionsProps {
  quoteLegalTerms: string;
}

export default function QuoteTermsAndConditions(props: QuoteTermsAndConditionsProps) {
  const { quoteLegalTerms = '' } = props;

  const [isOpen, setIsOpen] = useState(false);

  const b3Lang = useB3Lang();

  const handleOnChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Card
      sx={{
        '.MuiCardContent-root': {
          maxHeight: isOpen ? '637px' : 'auto',
        },
      }}
    >
      <CardContent
        sx={{
          p: '16px !important',
        }}
      >
        <B3CollapseContainer
          title={b3Lang('quoteDetail.termsAndConditions')}
          handleOnChange={handleOnChange}
        >
          <Box>
            <Typography
              variant="body1"
              sx={{
                padding: '16px 0',
                maxHeight: '545px',
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
  );
}
