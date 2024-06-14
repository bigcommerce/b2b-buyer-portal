import { useState } from 'react';
import { Box, Grid } from '@mui/material';

import { useMobile } from '@/hooks';
import { isB2BUserSelector, useAppSelector } from '@/store';

import QuickOrderFooter from './components/QuickOrderFooter';
import QuickOrderPad from './components/QuickOrderPad';
import QuickorderTable from './components/QuickorderTable';

function Quickorder() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const role = useAppSelector(({ company }) => company.customer.role);

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const [isMobile] = useMobile();

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const [checkedArr, setCheckedArr] = useState<CustomFieldItems>([]);

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
          sx={{
            m: 0,
            width: '100%',
          }}
          container
          spacing={2}
        >
          <Grid
            item
            xs={isMobile ? 12 : 8}
            sx={{
              backgroundColor: '#ffffff',
              boxShadow:
                '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
              borderRadius: '4px',
              pr: '16px',
            }}
          >
            <QuickorderTable
              setCheckedArr={setCheckedArr}
              setIsRequestLoading={setIsRequestLoading}
              isRequestLoading={isRequestLoading}
            />
          </Grid>
          <Grid
            item
            xs={isMobile ? 12 : 4}
            sx={{
              pt: !isMobile ? '0px !important' : '16px',
              pl: isMobile ? '0px !important' : '16px',
            }}
          >
            {role !== 2 && <QuickOrderPad isB2BUser={isB2BUser} />}
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
          role={role}
          checkedArr={checkedArr}
          isAgenting={isAgenting}
          setIsRequestLoading={setIsRequestLoading}
          isB2BUser={isB2BUser}
        />
      </Box>
    </Box>
  );
}

export default Quickorder;
