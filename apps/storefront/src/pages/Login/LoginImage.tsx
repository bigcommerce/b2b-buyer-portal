import { Box, ImageListItem } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';

import { LoginImageContainer } from './styled';

interface LoginImageProps {
  src: string;
}

export default function LoginImage({ src }: LoginImageProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const handleImageClick = () => {
    window.location.href = '/';
  };

  return (
    <Box sx={{ margin: '20px 0', minHeight: '150px' }}>
      <LoginImageContainer>
        <ImageListItem
          sx={{
            maxWidth: isMobile ? '70%' : '250px',
          }}
          onClick={handleImageClick}
        >
          <img src={src} alt={b3Lang('login.registerLogo')} loading="lazy" />
        </ImageListItem>
      </LoginImageContainer>
    </Box>
  );
}
