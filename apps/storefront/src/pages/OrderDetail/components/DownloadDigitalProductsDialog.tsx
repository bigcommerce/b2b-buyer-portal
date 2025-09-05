import { InsertDriveFileOutlined } from '@mui/icons-material';
import { Box, Button, Typography, useTheme } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { ProductItem } from '@/types';

interface DownloadDigitalProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductItem;
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
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  return (
    <B3Dialog
      isOpen={isOpen}
      fullWidth
      handleLeftClick={onClose}
      title={b3Lang('orderDetail.digitalProducts.filesToDownload')}
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
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: primaryColor,
              borderRadius: '10px',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex' }}>
              <InsertDriveFileOutlined
                sx={{
                  color: primaryColor,
                  fontSize: '40px',
                }}
              />
              <Typography
                sx={{
                  color: primaryColor,
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
                color: primaryColor,
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
