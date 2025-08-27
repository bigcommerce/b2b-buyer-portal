import { useB3Lang } from '@b3/lang';
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
import { ReactElement, ReactNode, useRef } from 'react';

import useMobile from '@/hooks/useMobile';
import useScrollBar from '@/hooks/useScrollBar';
import { useAppSelector } from '@/store';

import CustomButton from './button/CustomButton';
import B3Spin from './spin/B3Spin';

export interface B3DialogProps<T> {
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
        aria-describedby="alert-dialog-description"
        aria-labelledby="alert-dialog-title"
        container={container.current}
        fullScreen={isMobile}
        fullWidth={fullWidth}
        id="b2b-dialog-container"
        maxWidth={maxWidth}
        onClose={(_: object, reason: string) => handleCloseClick(reason)}
        open={isOpen && Boolean(container.current)}
        sx={customStyle}
        {...restDialogParams}
      >
        {title && (
          <DialogTitle
            id="alert-dialog-title"
            sx={
              isShowBordered
                ? {
                    borderBottom: '1px solid #D9DCE9',
                    mb: 2,
                  }
                : {}
            }
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
                  onClick={() => handleCloseClick('')}
                  sx={{
                    ...leftStyleBtn,
                  }}
                >
                  {leftSizeBtn || b3Lang('global.dialog.cancel')}
                </CustomButton>
              )}

              {showRightBtn && (
                <CustomButton
                  autoFocus
                  disabled={disabledSaveBtn || loading}
                  onClick={handleSaveClick}
                  sx={{
                    ...rightStyleBtn,
                  }}
                >
                  <B3Spin isSpinning={loading} size={16} tip="">
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
