import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';

interface ConfirmMasqueradeDialogProps {
  title: string;
  isOpen: boolean;
  isRequestLoading: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
}

export function ConfirmMasqueradeDialog({
  title,
  isOpen,
  isRequestLoading,
  handleClose,
  handleConfirm,
}: ConfirmMasqueradeDialogProps) {
  const b3Lang = useB3Lang();

  return (
    <B3Dialog
      isOpen={isOpen}
      rightSizeBtn={b3Lang('dashboard.masqueradeModal.actions.continue')}
      title={title}
      leftSizeBtn={b3Lang('dashboard.masqueradeModal.actions.cancel')}
      maxWidth={false}
      loading={isRequestLoading}
      handleLeftClick={handleClose}
      handRightClick={handleConfirm}
      dialogWidth="480px"
      dialogSx={{
        '& .MuiPaper-elevation': {
          '& h2': {
            border: 'unset',
            color: '#000000',
          },
          '& div': {
            border: 'unset',
          },
        },
      }}
    >
      <Box
        sx={{
          maxHeight: '600px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            color: '#000000',
            fontSize: '14px',
            fontWeight: 400,
          }}
        >
          {b3Lang('dashboard.masqueradeModal.message')}
        </Box>
      </Box>
    </B3Dialog>
  );
}
