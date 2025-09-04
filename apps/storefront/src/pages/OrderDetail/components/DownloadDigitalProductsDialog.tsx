import React from 'react';
import { InsertDriveFileOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';

interface DownloadDigitalProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    downloadFileUrls?: string[];
    product_id?: number;
    name?: string;
    sku?: string;
  };
  b3Lang: (key: string) => string;
  handleDownloadDigitalFile: (fileUrl: string) => void;
}

function DownloadDigitalProductsDialog({
  isOpen,
  onClose,
  product,
  b3Lang,
  handleDownloadDigitalFile,
}: DownloadDigitalProductsDialogProps) {
  return (
    <B3Dialog
      isOpen={isOpen}
      fullWidth
      handleLeftClick={onClose}
      title={b3Lang('orderDetail.digitalProducts.filesToDownload')}
      rightSizeBtn={undefined}
      leftSizeBtn={b3Lang('orderDetail.digitalProducts.close')}
      maxWidth="md"
      showRightBtn={false}
    >
      {product?.downloadFileUrls?.map((fileUrl: string, index: number) => {
        const key = `${product?.product_id}-${index}`;
        return (
          <Box
            key={key}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              margin: '15px 0 15px 0',
              border: '1px solid #1976D2',
              borderRadius: '10px',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex' }}>
              <InsertDriveFileOutlined
                sx={{
                  color: '#1976D2',
                  fontSize: '40px',
                }}
              />
              <Typography
                sx={{
                  color: '#1976D2',
                  fontSize: '14px',
                  alignSelf: 'center',
                }}
              >
                {`${product?.name} ${index + 1}`}
              </Typography>
            </Box>
            <Button
              onClick={() => handleDownloadDigitalFile(fileUrl)}
              sx={{
                color: '#1976D2',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              {b3Lang('orderDetail.digitalProducts.download')}
            </Button>
          </Box>
        );
      })}
    </B3Dialog>
  );
}

export default DownloadDigitalProductsDialog;
