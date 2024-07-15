import { ReactNode, useContext, useState } from 'react';
import { Close, Dehaze, ShoppingBagOutlined } from '@mui/icons-material';
import { Badge, Box } from '@mui/material';

import { CART_URL } from '@/constants';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';

import CompanyCredit from '../CompanyCredit';
import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles';

import B3AccountInfo from './B3AccountInfo';
import B3CloseAppButton from './B3CloseAppButton';
import B3Logo from './B3Logo';
import B3Nav from './B3Nav';

export default function B3MobileLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const [isOpenMobileSidebar, setOpenMobileSidebar] = useState<boolean>(false);
  const cartNumber = useAppSelector(({ global }) => global.cartNumber);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);

  const isShowCart = isB2BUser ? purchasabilityPermission : true;

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const openRouteList = () => {
    setOpenMobileSidebar(true);
  };

  const customColor = getContrastColor(backgroundColor);

  return (
    <Box
      sx={{
        height: '70vh',
        p: '4vw',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '4.5vw',
        }}
      >
        <Badge badgeContent={0} color="secondary">
          <Dehaze onClick={openRouteList} sx={{ color: customColor }} />
        </Badge>

        <B3Logo />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',

            '& span': {
              marginRight: '1.5rem',
            },
          }}
        >
          {isShowCart && (
            <Badge
              badgeContent={cartNumber}
              max={1000}
              sx={{
                '& .MuiBadge-badge': {
                  color: '#FFFFFF',
                  backgroundColor: '#1976D2',
                  fontWeight: 500,
                  fontSize: '12px',
                  minWidth: '18px',
                  height: '18px',
                  top: '8px',
                  right: '3px',
                  marginRight: '-0.5rem',
                },
              }}
            >
              <ShoppingBagOutlined
                sx={{ color: 'rgba(0, 0, 0, 0.54)', marginRight: '-0.5rem' }}
                onClick={() => {
                  window.location.href = CART_URL;
                }}
              />
            </Badge>
          )}
          <Box
            sx={{
              marginLeft: '2px',
              height: '24px',
            }}
          >
            <B3CloseAppButton />
          </Box>
        </Box>
      </Box>

      <Box
        component="h1"
        sx={{
          p: 0,
          m: 0,
          mb: '6vw',
          fontSize: '34px',
          fontWeight: '400',
          color: customColor || '#263238',
        }}
      >
        {title}
      </Box>
      <CompanyCredit />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          paddingBottom: isAgenting ? '52px' : '0',
        }}
      >
        {children}
      </Box>
      {isOpenMobileSidebar && (
        <Box
          sx={{
            height: '100vh',
            position: 'fixed',
            width: '92vw',
            zIndex: 1000,
            left: 0,
            top: 0,
            p: '4vw',
            backgroundColor: 'white',
            boxShadow:
              '0px 7px 8px -4px #00000033, 0px 12px 17px 2px #00000024, 0px 5px 22px 4px #0000001f',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              pb: '4vw',
            }}
          >
            <B3AccountInfo closeSidebar={setOpenMobileSidebar} />
            <Close onClick={() => setOpenMobileSidebar(false)} />
          </Box>

          <B3Nav closeSidebar={setOpenMobileSidebar} />
        </Box>
      )}
    </Box>
  );
}
