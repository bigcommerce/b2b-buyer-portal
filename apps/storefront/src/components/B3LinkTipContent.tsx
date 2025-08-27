import { dispatchEvent } from '@b3/hooks';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface B3SuccessTipContentProps {
  message: string;
  link?: string;
  linkText?: string;
  isOutLink?: boolean;
  isCustomEvent?: boolean;
}

export function B3LinkTipContent({
  message,
  link = '',
  linkText = 'View',
  isOutLink = false,
  isCustomEvent = false,
}: B3SuccessTipContentProps) {
  const navigate = useNavigate();

  const handleLink = () => {
    if (isCustomEvent) {
      if (!dispatchEvent('on-click-cart-button')) {
        return;
      }
    }

    if (isOutLink) {
      window.location.href = link;
    } else {
      navigate(link);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'inline',
          marginRight: link ? '20px' : '0',
        }}
      >
        {message}
      </Box>
      {link && (
        <Box
          onClick={handleLink}
          sx={{
            color: 'inherit',
            display: 'inline',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {linkText}
        </Box>
      )}
    </Box>
  );
}

export const successTip = ({
  message,
  link = '',
  linkText = 'View',
  isOutLink = false,
  isCustomEvent = false,
}: B3SuccessTipContentProps) =>
  function componentTip() {
    return (
      <B3LinkTipContent
        isCustomEvent={isCustomEvent}
        isOutLink={isOutLink}
        link={link}
        linkText={linkText}
        message={message}
      />
    );
  };
