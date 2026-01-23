import { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';

import useStorageState from '@/hooks/useStorageState';
import { useB3Lang } from '@/lib/lang';
import { getCompanyCreditConfig } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';

const permissionRoles = [0, 1, 2];

function CompanyCredit() {
  const b3Lang = useB3Lang();
  const [isEnabled, setEnabled] = useState<boolean>(false);
  const [isCloseCompanyCredit, setIsCloseCompanyCredit] = useStorageState<boolean>(
    'sf-isCloseCompanyCredit',
    false,
    sessionStorage,
  );
  const role = useAppSelector(({ company }) => company.customer.role);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  useEffect(() => {
    const init = async () => {
      if (isCloseCompanyCredit) {
        return;
      }

      if (permissionRoles.includes(Number(role)) || (Number(role) === 3 && isAgenting)) {
        const {
          companyCreditConfig: { creditHold, creditEnabled },
        } = await getCompanyCreditConfig();

        setEnabled(creditHold && creditEnabled);
      }
    };

    init();
  }, [role, isAgenting, isCloseCompanyCredit]);

  const handleCompanyCreditCloseClick = () => {
    setIsCloseCompanyCredit(true);
    setEnabled(false);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <Box
      sx={{
        margin: '1rem 0',
      }}
    >
      <Alert onClose={() => handleCompanyCreditCloseClick()} severity="warning" variant="filled">
        {b3Lang('global.companyCredit.alert')}
      </Alert>
    </Box>
  );
}

export default CompanyCredit;
