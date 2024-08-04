import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { type SetOpenPage } from '@/pages/SetOpenPage';
import { GlobaledContext } from '@/shared/global';

import { CloseButton } from './styled';

interface CloseButtonProps {
  setOpenPage: SetOpenPage;
}

export default function RegisteredCloseButton(props: CloseButtonProps) {
  const { setOpenPage } = props;

  const {
    state: { isCloseGotoBCHome },
  } = useContext(GlobaledContext);
  const navigate = useNavigate();

  const handleCloseForm = () => {
    if (isCloseGotoBCHome) {
      window.location.href = '/';
    } else {
      navigate('/');
      setOpenPage({
        isOpen: false,
        openUrl: '',
      });
    }
    window.history.replaceState(null, '', window.location.pathname || '/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row-reverse',
        pr: 2,
      }}
    >
      <CloseButton onClick={handleCloseForm} />
    </Box>
  );
}
