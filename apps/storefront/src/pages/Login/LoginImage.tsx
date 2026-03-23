import { Box, ImageListItem } from '@mui/material';

interface LoginImageProps {
  src: string;
  maxWidth: string;
  alt: string;
  onClick: (event: React.MouseEvent<HTMLLIElement>) => void;
}

export default function LoginImage({ src, alt, maxWidth, onClick }: LoginImageProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <ImageListItem
        sx={{
          maxWidth,
        }}
        onClick={onClick}
      >
        <img src={src} alt={alt} loading="lazy" />
      </ImageListItem>
    </Box>
  );
}
