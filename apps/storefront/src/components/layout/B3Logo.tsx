import { Box, ImageListItem } from '@mui/material';
import { useContext } from 'react';

import b2bLogo from '@/assets/b2bLogo.png';
import { useMobile } from '@/hooks';
import { GlobalContext } from '@/shared/global';
import { getAssetUrl } from '@/utils/getAssetUrl';

export default function B3Logo() {
  const {
    state: { logo },
  } = useContext(GlobalContext);

  const [isMobile] = useMobile();

  return (
    <Box
      sx={
        isMobile
          ? {
              height: '40px',
              width: '140px',
              '& li': {
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '1rem',
              },
              '& img': {
                maxHeight: '40px',
              },
            }
          : {
              width: '200px',
              height: '65px',
              display: 'flex',
              alignItems: 'center',
              maxHeight: '65px',
              '& img': {
                maxHeight: '65px',
              },
            }
      }
    >
      <ImageListItem
        onClick={() => {
          window.location.href = '/';
        }}
        sx={{
          maxWidth: '200px',
          cursor: 'pointer',
          '& .MuiImageListItem-img': {
            objectFit: 'contain',
            width: 'auto',
          },
        }}
      >
        <img alt="logo" src={logo || getAssetUrl(b2bLogo)} />
      </ImageListItem>
    </Box>
  );
}
