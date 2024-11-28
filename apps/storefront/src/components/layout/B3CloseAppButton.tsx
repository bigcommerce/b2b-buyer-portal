import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import useMobile from '@/hooks/useMobile';
import { GlobalContext } from '@/shared/global';
import { useAppSelector } from '@/store';

import { CloseBox, CloseBoxMobile, CloseButton } from '../styled';

export default function B3CloseAppButton() {
  const [isMobile] = useMobile();

  const setOpenPageFn = useAppSelector(({ global }) => global.setOpenPageFn);

  const {
    state: { isCloseGotoBCHome },
  } = useContext(GlobalContext);
  const navigate = useNavigate();

  const handleCloseForm = () => {
    if (isCloseGotoBCHome) {
      window.location.href = '/';
    } else {
      navigate('/');
      setOpenPageFn?.({
        isOpen: false,
        openUrl: '',
      });
    }
    window.history.replaceState(null, '', window.location.pathname || '/');
  };

  const Box = isMobile ? CloseBoxMobile : CloseBox;

  return (
    <Box>
      <CloseButton
        sx={{
          color: '#757371',
        }}
        onClick={handleCloseForm}
      />
    </Box>
  );
}
