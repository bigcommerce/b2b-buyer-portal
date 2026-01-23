import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useB3Lang } from '@/lib/lang';

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
      dialogSx={{
        zIndex: 12006,
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
      dialogWidth="480px"
      handRightClick={handleConfirm}
      handleLeftClick={handleClose}
      isOpen={isOpen}
      leftSizeBtn={b3Lang('dashboard.masqueradeModal.actions.cancel')}
      loading={isRequestLoading}
      maxWidth={false}
      rightSizeBtn={b3Lang('dashboard.masqueradeModal.actions.continue')}
      title={title}
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
