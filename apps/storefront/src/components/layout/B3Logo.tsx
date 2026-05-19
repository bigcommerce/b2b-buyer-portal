import { useContext } from 'react';
import { Box, ImageListItem } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { GlobalContext } from '@/shared/global';

export default function B3Logo() {
  const {
    state: { logo, isLogoLoaded },
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
      {isLogoLoaded && logo && (
        <ImageListItem
          sx={{
            maxWidth: '200px',
            cursor: 'pointer',
            '& .MuiImageListItem-img': {
              objectFit: 'contain',
              width: 'auto',
            },
          }}
          onClick={() => {
            window.location.href = '/';
          }}
        >
          <img src={logo} alt="logo" />
        </ImageListItem>
      )}
    </Box>
  );
}
