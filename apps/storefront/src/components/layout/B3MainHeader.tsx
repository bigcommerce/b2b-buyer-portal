import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dispatchEvent } from '@b3/hooks';
import { useB3Lang } from '@b3/lang';
import { Box, Button, Grid, Typography } from '@mui/material';

import { CART_URL } from '@/constants';
import useMobile from '@/hooks/useMobile';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';

import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles';

import B3AccountInfo from './B3AccountInfo';
import B3CompanyHierarchy from './B3CompanyHierarchy';
import B3StatusNotification from './B3StatusNotification';

export default function MainHeader({ title }: { title: string }) {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyInfo = useAppSelector(({ company }) => company.companyInfo);
  const salesRepCompanyName = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.companyName,
  );
  const cartNumber = useAppSelector(({ global }) => global.cartNumber);
  const navigate = useNavigate();
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);

  const { isEnabledCompanyHierarchy } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const isShowCart = isB2BUser ? purchasabilityPermission : true;

  const customColor = getContrastColor(backgroundColor);

  const onCartClick = () => {
    if (!dispatchEvent('on-click-cart-button')) {
      return;
    }

    window.location.href = CART_URL;
  };

  useEffect(() => {
    b3TriggerCartNumber();
  }, []);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '70px',
          alignItems: 'center',
        }}
      >
        <Grid
          sx={{
            alignItems: 'center',
            flexDirection: 'row',
            display: 'flex',
          }}
        >
          <Box
            component="h4"
            sx={{
              fontSize: '20px',
              fontWeight: '500',
              color: customColor || '#333333',
              ml: 0,
            }}
          >
            {Number(role) === 3 &&
              (companyInfo?.companyName ||
                salesRepCompanyName ||
                b3Lang('global.B3MainHeader.superAdmin'))}
          </Box>
          {isEnabledCompanyHierarchy && <B3CompanyHierarchy />}
        </Grid>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {role !== 100 && <B3AccountInfo />}
          <Box sx={{ marginLeft: '8px' }}>
            {role === 100 && (
              <Button
                sx={{
                  color: '#333333',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
                onClick={() => {
                  navigate('/login');
                }}
              >
                {b3Lang('global.B3MainHeader.signIn')}
              </Button>
            )}
            <Button
              sx={{
                color: '#333333',
                fontWeight: 700,
                fontSize: '16px',
              }}
              onClick={() => {
                window.location.href = '/';
              }}
            >
              {b3Lang('global.B3MainHeader.home')}
            </Button>
            {isShowCart && (
              <Button
                sx={{
                  color: '#333333',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
                onClick={onCartClick}
              >
                {b3Lang('global.B3MainHeader.cart')}
                {cartNumber > 0 ? (
                  <Typography
                    id="cart-number-icon"
                    sx={{
                      backgroundColor: '#1976D2',
                      minWidth: '21px',
                      height: '20px',
                      color: '#FFFFFF',
                      borderRadius: '64px',
                      fontSize: '12px',
                      fontWeight: '500',
                      lineHeight: '20px',
                      marginLeft: '3px',
                      padding: '0px 6.5px',
                    }}
                  >
                    {cartNumber}
                  </Typography>
                ) : null}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      {title && (
        <Box
          component="h3"
          sx={{
            height: '40px',
            m: '0',
            fontSize: '34px',
            fontWeight: 400,
            lineHeight: '42px',
            display: 'flex',
            alignItems: 'end',
            mb: '24px',
            mt: isMobile ? 0 : '24px',
            color: customColor,
          }}
        >
          {title}
        </Box>
      )}
      <B3StatusNotification title={title} />
    </Box>
  );
}
