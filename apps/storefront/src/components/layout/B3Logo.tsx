import { useContext } from 'react';
import { Box, ImageListItem } from '@mui/material';

import { STORE_DEFAULT_LOGO } from '@/constants';
import { useMobile } from '@/hooks';
import { GlobaledContext } from '@/shared/global';

export default function B3Logo() {
  const {
    state: { logo },
  } = useContext(GlobaledContext);

  const [isMobile] = useMobile();

  return (
    <Box
      sx={
        isMobile
          ? {
              flexShrink: '0',
              height: 'auto',
              width: '45%',
              display: 'contents',
              '& img': {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              },
            }
          : {
              width: '100%',
              height: '64px',
              '& img': {
                width: '100%',
                maxHeight: '64px',
                objectFit: 'contain',
              },
            }
      }
    >
      <ImageListItem
        sx={{
          maxWidth: '250px',
          cursor: 'pointer',
        }}
        onClick={() => {
          window.location.href = '/';
        }}
      >
        <img src={logo || STORE_DEFAULT_LOGO} alt="logo" />
      </ImageListItem>
    </Box>
  );
}
