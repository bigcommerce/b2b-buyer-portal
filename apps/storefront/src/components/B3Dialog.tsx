import { ReactElement, ReactNode, useRef } from 'react';
import {
  Box,
  Breakpoint,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  SxProps,
  Theme,
} from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useScrollBar } from '@/hooks/useScrollBar';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';

import CustomButton from './button/CustomButton';
import B3Spin from './spin/B3Spin';

interface B3DialogProps<T> {
  customActions?: () => ReactElement;
  isOpen: boolean;
  leftStyleBtn?: { [key: string]: string };
  rightStyleBtn?: { [key: string]: string };
  leftSizeBtn?: string;
  rightSizeBtn?: string;
  title?: string;
  handleLeftClick?: () => void;
  handRightClick?: (row?: T) => Promise<void> | void | undefined;
  children: ReactNode;
  loading?: boolean;
  row?: T;
  isShowBordered?: boolean;
  showRightBtn?: boolean;
  showLeftBtn?: boolean;
  maxWidth?: Breakpoint | false;
  fullWidth?: boolean;
  disabledSaveBtn?: boolean;
  dialogContentSx?: SxProps<Theme>;
  dialogSx?: SxProps<Theme>;
  dialogWidth?: string;
  restDialogParams?: Omit<DialogProps, 'open' | 'onClose'>;
}

export default function B3Dialog<T>({
  customActions,
  isOpen,
  leftStyleBtn = {},
  rightStyleBtn = {},
  leftSizeBtn,
  rightSizeBtn,
  title,
  handleLeftClick,
  handRightClick,
  children,
  loading = false,
  row,
  isShowBordered = true,
  showRightBtn = true,
  showLeftBtn = true,
  maxWidth = 'sm',
  dialogContentSx = {},
  dialogSx = {},
  fullWidth = false,
  disabledSaveBtn = false,
  dialogWidth = '',
  restDialogParams,
}: B3DialogProps<T>) {
  const container = useRef<HTMLInputElement | null>(null);

  const [isMobile] = useMobile();

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const customStyle = dialogWidth
    ? {
        '& .MuiPaper-elevation': {
          width: isMobile ? '100%' : dialogWidth,
        },
        ...dialogSx,
      }
    : {
        ...dialogSx,
      };

  const handleSaveClick = () => {
    if (handRightClick) {
      if (row) handRightClick(row);
      if (!row) handRightClick();
    }
  };

  const handleCloseClick = (reason?: string) => {
    if (reason === 'backdropClick') return;
    if (handleLeftClick) handleLeftClick();
  };

  useScrollBar(isOpen);

  const b3Lang = useB3Lang();

  return (
    <Box>
      <Box ref={container} />

      <Dialog
        fullWidth={fullWidth}
        open={isOpen && Boolean(container.current)}
        container={container.current}
        onClose={(_: object, reason: string) => handleCloseClick(reason)}
        fullScreen={isMobile}
        maxWidth={maxWidth}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        id="b2b-dialog-container"
        sx={customStyle}
        {...restDialogParams}
      >
        {title && (
          <DialogTitle
            sx={
              isShowBordered
                ? {
                    borderBottom: '1px solid #D9DCE9',
                    mb: 2,
                  }
                : {}
            }
            id="alert-dialog-title"
          >
            {title}
          </DialogTitle>
        )}
        <DialogContent
          sx={{
            ...dialogContentSx,
          }}
        >
          {children}
        </DialogContent>
        <DialogActions
          sx={
            isShowBordered
              ? {
                  borderTop: '1px solid #D9DCE9',
                  marginBottom: isAgenting && isMobile ? '52px' : '0',
                }
              : {
                  marginBottom: isAgenting && isMobile ? '52px' : '0',
                }
          }
        >
          {customActions ? (
            customActions()
          ) : (
            <>
              {showLeftBtn && (
                <CustomButton
                  sx={{
                    ...leftStyleBtn,
                  }}
                  onClick={() => handleCloseClick('')}
                >
                  {leftSizeBtn || b3Lang('global.dialog.cancel')}
                </CustomButton>
              )}

              {showRightBtn && (
                <CustomButton
                  sx={{
                    ...rightStyleBtn,
                  }}
                  onClick={handleSaveClick}
                  autoFocus
                  disabled={disabledSaveBtn || loading}
                >
                  <B3Spin isSpinning={loading} tip="" size={16}>
                    {rightSizeBtn || b3Lang('global.dialog.save')}
                  </B3Spin>
                </CustomButton>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
