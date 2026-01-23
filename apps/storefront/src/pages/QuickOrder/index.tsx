import { useState } from 'react';
import { Box, Grid } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';

import QuickOrderTable from './components/QuickOrderB2BTable';
import QuickOrderFooter from './components/QuickOrderFooter';
import QuickOrderPad from './components/QuickOrderPad';
import { CheckedProduct } from './utils';

function QuickOrder() {
  const isB2BUser = useAppSelector(isB2BUserSelector);

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const [isMobile] = useMobile();

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const [checkedArr, setCheckedArr] = useState<CheckedProduct[]>([]);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);

  const isShowQuickOrderPad = isB2BUser ? purchasabilityPermission : true;

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            m: 0,
            width: '100%',
          }}
        >
          <Grid
            item
            sx={{
              backgroundColor: '#ffffff',
              boxShadow:
                '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
              borderRadius: '4px',
              pr: '16px',
            }}
            xs={isMobile ? 12 : 8}
          >
            <QuickOrderTable
              isRequestLoading={isRequestLoading}
              setCheckedArr={setCheckedArr}
              setIsRequestLoading={setIsRequestLoading}
            />
          </Grid>
          <Grid
            item
            sx={{
              pt: isMobile ? '16px' : '0px !important',
              pl: isMobile ? '0px !important' : '16px',
            }}
            xs={isMobile ? 12 : 4}
          >
            {isShowQuickOrderPad && <QuickOrderPad />}
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: '999',
        }}
      >
        <QuickOrderFooter
          checkedArr={checkedArr}
          isAgenting={isAgenting}
          isB2BUser={isB2BUser}
          setIsRequestLoading={setIsRequestLoading}
        />
      </Box>
    </Box>
  );
}

export default QuickOrder;
