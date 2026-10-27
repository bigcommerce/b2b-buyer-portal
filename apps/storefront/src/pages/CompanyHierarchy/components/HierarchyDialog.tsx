import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useB3Lang } from '@/lib/lang';

interface HierarchyDialogProps {
  open: boolean;
  handleClose: () => void;
  onConfirm: () => void;
  isRequestLoading?: boolean;
  title?: string;
  context?: string;
  dialogParams?: { [key: string]: string };
}

function HierarchyDialog({
  open = false,
  handleClose,
  onConfirm,
  isRequestLoading = false,
  title,
  context,
  dialogParams = {},
}: HierarchyDialogProps) {
  const b3Lang = useB3Lang();

  return (
    <B3Dialog
      isOpen={open}
      rightSizeBtn={b3Lang('global.button.next')}
      title={title || b3Lang('companyHierarchy.dialog.title')}
      fullWidth
      loading={isRequestLoading}
      handleLeftClick={handleClose}
      handRightClick={onConfirm}
      dialogSx={{
        '& .MuiDialogTitle-root': {
          border: 0,
        },
        '& .MuiDialogActions-root': {
          border: 0,
        },
      }}
      {...dialogParams}
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
          }}
        >
          {context || b3Lang('companyHierarchy.dialog.content')}
        </Box>
      </Box>
    </B3Dialog>
  );
}

export default HierarchyDialog;
