/* eslint-disable react/function-component-definition */
import { FC, PropsWithChildren, useContext } from 'react';
import { Box, ImageListItem } from '@mui/material';
import { GlobalContext } from '@/shared/global';

import { B3Card } from '@/components';
import { useMobile } from '@/hooks';
import { LoginImage } from '@/pages/Login/styled';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { useB3Lang } from '@b3/lang';

export interface Props {
  setOpenPage: SetOpenPage;
  logoAlt: string;
}

const Modal: FC<PropsWithChildren<Props>> = ({ setOpenPage, logoAlt, children }) => {
  const { logo } = useContext(GlobalContext).state;

  const [isMobile] = useMobile();
  const navigateHome = () => window.location.assign('/');

  return (
    <B3Card setOpenPage={setOpenPage}>
      <Box padding={'20px'}>
        {logo && (
          <Box sx={{ display: 'flex', minHeight: '150px', alignItems: 'center', margin: '20px 0' }}>
            <LoginImage>
              <ImageListItem sx={{ maxWidth: isMobile ? '70%' : '250px' }} onClick={navigateHome}>
                <img src={logo} alt={logoAlt} loading="lazy" />
              </ImageListItem>
            </LoginImage>
          </Box>
        )}
        {children}
      </Box>
    </B3Card>
  );
};

type WithModal = (component: FC) => FC<{ setOpenPage: SetOpenPage }>;

export const withinModal: WithModal =
  (Component) =>
  ({ setOpenPage }) => {
    const b3Lang = useB3Lang();

    return (
      <Modal setOpenPage={setOpenPage} logoAlt={b3Lang('login.registerLogo')}>
        <Component />
      </Modal>
    );
  };
