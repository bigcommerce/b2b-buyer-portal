import { Box, ImageListItem } from '@mui/material';

const LOGO_CONTAINER_SX = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
};

interface LogoProps {
  logoUrl: string;
  logoAlt: string;
}

export function Logo({ logoUrl, logoAlt }: LogoProps) {
  return (
    <Box sx={LOGO_CONTAINER_SX}>
      <ImageListItem
        sx={{
          maxWidth: '250px',
        }}
        onClick={() => {
          window.location.href = '/';
        }}
      >
        <img src={logoUrl} alt={logoAlt} loading="lazy" />
      </ImageListItem>
    </Box>
  );
}
