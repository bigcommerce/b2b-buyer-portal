import { Box, Typography } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useB3Lang } from '@/lib/lang';

interface QuoteSubmissionResponseProps {
  isOpen: boolean;
  onClose: () => void;
  quoteSubmissionResponseInfo: {
    value: string;
    key: string;
    message: string;
    title: string;
  };
}

function QuoteSubmissionResponse({
  isOpen = false,
  onClose,
  quoteSubmissionResponseInfo,
}: QuoteSubmissionResponseProps) {
  const b3Lang = useB3Lang();
  const messageArr = quoteSubmissionResponseInfo.message.split('\n');

  return (
    <Box
      sx={{
        '#b2b-dialog-container': {
          '& [aria-labelledby="alert-dialog-title"]': {
            width: '500px',
            maxHeight: '500px',
          },

          '& h2': {
            color: '#313440',
          },
          '& h6': {
            color: '#313440',
            fontSize: '16px',
          },
        },
      }}
    >
      <B3Dialog
        handRightClick={onClose}
        isOpen={isOpen}
        isShowBordered={false}
        maxWidth={false}
        rightSizeBtn={b3Lang('quoteDraft.submission.response.button.text')}
        showLeftBtn={false}
        title={quoteSubmissionResponseInfo.title}
      >
        {messageArr.map((item) => {
          return (
            <Typography
              key={item}
              sx={{
                marginTop: '1rem',
              }}
              variant="subtitle2"
            >
              {item}
            </Typography>
          );
        })}
      </B3Dialog>
    </Box>
  );
}

export default QuoteSubmissionResponse;
