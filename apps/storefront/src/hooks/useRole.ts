import { useEffect, useState } from 'react';

import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';

const useRole = () => {
  const [roleText, setRoleText] = useState('');
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const getRole = (role: number, isAgenting: boolean) => {
    let roleStr = '';

    switch (role) {
      case CustomerRole.GUEST:
        roleStr = 'guest';
        break;

      case CustomerRole.B2C:
        roleStr = 'b2c';
        break;

      case CustomerRole.SUPER_ADMIN:
        roleStr = isAgenting ? 'b2b' : 'b2c';
        break;

      default:
        roleStr = 'b2b';
    }

    setRoleText(roleStr);
  };

  useEffect(() => {
    getRole(Number(role), isAgenting);
  }, [isB2BUser, role, isAgenting]);

  return [roleText];
};

export { useRole };
