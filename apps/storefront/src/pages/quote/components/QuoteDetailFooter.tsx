import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';

import { handleQuoteCheckout } from '../utils/quoteCheckout';

interface QuoteDetailFooterProps {
  quoteId: string;
  role: string | number;
  isAgenting: boolean;
  status: number;
  proceedingCheckoutFn: () => boolean;
}

function QuoteDetailFooter(props: QuoteDetailFooterProps) {
  const { quoteId, role, isAgenting, status, proceedingCheckoutFn } = props;
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const location = useLocation();
  const navigate = useNavigate();

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-end',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      };

  return status !== 5 ? (
    <Box
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: '0.8rem 1rem',
        height: 'auto',
        display: 'flex',
        zIndex: '999',
        justifyContent: isMobile ? 'center' : 'flex-end',
        displayPrint: 'none',
        ...containerStyle,
      }}
    >
      <CustomButton
        variant="contained"
        onClick={() => {
          handleQuoteCheckout({
            proceedingCheckoutFn,
            role,
            location,
            quoteId,
            navigate,
          });
        }}
        sx={{
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {b3Lang('quoteDetail.footer.proceedToCheckout')}
      </CustomButton>
    </Box>
  ) : null;
}

export default QuoteDetailFooter;
