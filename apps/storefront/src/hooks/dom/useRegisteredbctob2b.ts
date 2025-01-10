import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import config from '@b3/global-b3';
import { useB3Lang } from '@b3/lang';

import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { OpenPageState } from '@/types/hooks';
import b2bLogger from '@/utils/b3Logger';

import b2bVerifyBcLoginStatus from '../../utils/b2bVerifyBcLoginStatus';

import useDomVariation from './useDomVariation';

const useRegisteredbctob2b = (setOpenPage: Dispatch<SetStateAction<OpenPageState>>) => {
  const b3Lang = useB3Lang();

  const {
    state: { registerEnabled },
  } = useContext(GlobalContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const customerId = useAppSelector(({ company }) => company.customer.id);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);

  const {
    state: {
      accountLoginRegistration: { b2b },
    },
  } = useContext(CustomStyleContext);

  const [openQuickView] = useDomVariation(config['dom.navUserLoginElement']);
  const [isBcLogin, setIsBcLogin] = useState(false);

  const handleVerifyBcLoginStatus = async () => {
    try {
      const bcLoginStatus = await Promise.all([b2bVerifyBcLoginStatus()]);
      setIsBcLogin(bcLoginStatus[0]);
    } catch (error) {
      b2bLogger.error(error);
    }
  };

  useEffect(() => {
    if (+role === CustomerRole.B2C) {
      handleVerifyBcLoginStatus();
    }
  }, [role]);

  useEffect(() => {
    const createConvertB2BNavNode = () => {
      const convertB2BNavNode = document.createElement('li');
      convertB2BNavNode.className = 'navUser-item navUser-convert-b2b';
      convertB2BNavNode.innerHTML = `
        <a class="navUser-action" href="javascript:;" aria-label="Gift Certificates">
          ${b3Lang('global.registerB2B.linkText')}
        </a>
      `;
      return convertB2BNavNode;
    };

    if (
      b2b &&
      !isB2BUser &&
      +companyStatus === 99 &&
      customerId &&
      document.querySelector(config['dom.navUserLoginElement'])
    ) {
      // already exist
      const b2ToB2b = document.querySelector('.navUser-item.navUser-convert-b2b');

      if (b2ToB2b) {
        if (!registerEnabled) b2ToB2b.remove();

        return;
      }

      if (!registerEnabled || !isBcLogin) return;

      const convertB2BNavNode = createConvertB2BNavNode();
      const accountNode = document.querySelector(config['dom.navUserLoginElement']);

      accountNode?.parentNode?.insertBefore(convertB2BNavNode, accountNode);

      const linkNode = convertB2BNavNode.querySelector('a');
      if (linkNode) {
        linkNode.onclick = () => {
          setOpenPage({
            isOpen: true,
            openUrl: '/registeredbctob2b',
          });
        };
      }
    } else {
      document.querySelector('.navUser-item.navUser-convert-b2b')?.remove();
    }
    // ignoring to not add b3Lang to the dependencies array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isB2BUser, customerId, openQuickView, b2b, registerEnabled, companyStatus, isBcLogin]);
};

export default useRegisteredbctob2b;
