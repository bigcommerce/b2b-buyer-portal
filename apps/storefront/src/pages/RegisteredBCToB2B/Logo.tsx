import { ImageListItem } from '@mui/material';

import { RegisteredImage } from './styled';

interface LogoProps {
  logoUrl: string;
  logoAlt: string;
}

export function Logo({ logoUrl, logoAlt }: LogoProps) {
  return (
    <RegisteredImage>
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
    </RegisteredImage>
  );
}
