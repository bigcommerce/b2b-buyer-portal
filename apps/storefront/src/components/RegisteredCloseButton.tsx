import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { type SetOpenPage } from '@/pages/SetOpenPage';
import { GlobalContext } from '@/shared/global';

import { CloseButton } from './styled';

interface CloseButtonProps {
  setOpenPage: SetOpenPage;
}

export default function RegisteredCloseButton(props: CloseButtonProps) {
  const { setOpenPage } = props;

  const {
    state: { isCloseGotoBCHome },
  } = useContext(GlobalContext);
  const navigate = useNavigate();

  const handleCloseForm = () => {
    const isInLoginPage = window.location.hash.startsWith('#/login');
    if (isCloseGotoBCHome || isInLoginPage) {
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
