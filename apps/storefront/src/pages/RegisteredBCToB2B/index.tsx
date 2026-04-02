import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { GlobalContext } from '@/shared/global';
import { useAppSelector } from '@/store';
import { isLoggedInSelector } from '@/store/selectors';

import { type PageProps } from '../PageProps';
import { RegisteredProvider } from '../Registered/Context';

import { Register } from './Register';

export default function RegisteredBCToB2BPage(props: PageProps) {
  const {
    state: { logo, registerEnabled },
  } = useContext(GlobalContext);
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isRegisterCompanyFlowEnabled = useFeatureFlag('B2B-4466.use_register_company_flow');

  const accessDenied = !registerEnabled || (isRegisterCompanyFlowEnabled && !isLoggedIn);

  useEffect(() => {
    if (accessDenied) {
      navigate('/login');
    }
  }, [accessDenied, navigate]);

  if (accessDenied) {
    return null;
  }

  return (
    <RegisteredProvider>
      <Register {...props} logo={logo} />
    </RegisteredProvider>
  );
}
