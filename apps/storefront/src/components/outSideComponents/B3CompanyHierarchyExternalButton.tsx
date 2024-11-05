import { useMemo } from 'react';
import { useB3Lang } from '@b3/lang';
import BusinessIcon from '@mui/icons-material/Business';
import { Box, SnackbarOrigin } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';

import { PATH_ROUTES } from '@/constants';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { useAppSelector } from '@/store';

interface B3CompanyHierarchyExternalButtonProps {
  isOpen: boolean;
  setOpenPage: SetOpenPage;
}
function B3CompanyHierarchyExternalButton({
  isOpen,
  setOpenPage,
}: B3CompanyHierarchyExternalButtonProps) {
  const b3Lang = useB3Lang();

  const { selectCompanyHierarchyId, companyHierarchyList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const defaultLocation: SnackbarOrigin = {
    vertical: 'bottom',
    horizontal: 'left',
  };

  const companyName: string = useMemo(() => {
    if (!selectCompanyHierarchyId) {
      return '';
    }

    return (
      companyHierarchyList.find((company) => company.companyId === +selectCompanyHierarchyId)
        ?.companyName || ''
    );
  }, [selectCompanyHierarchyId, companyHierarchyList]);

  const { COMPANY_HIERARCHY } = PATH_ROUTES;

  return (
    <>
      {!isOpen && !!companyName && (
        <Snackbar
          sx={{
            zIndex: '99999999993',
          }}
          anchorOrigin={defaultLocation}
          open
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              color: '#FFFFFF',
              backgroundColor: '#ED6C02',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          >
            <BusinessIcon sx={{ color: '#FFFFFF', fontSize: '20px' }} />
            <Box
              sx={{
                margin: '0 0.5rem',
              }}
            >
              {b3Lang('global.companyHierarchy.externalBtn')}
            </Box>
            <Box
              sx={{
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() =>
                setOpenPage({
                  isOpen: true,
                  openUrl: COMPANY_HIERARCHY,
                })
              }
            >
              {companyName}
            </Box>
          </Box>
        </Snackbar>
      )}
    </>
  );
}

export default B3CompanyHierarchyExternalButton;
