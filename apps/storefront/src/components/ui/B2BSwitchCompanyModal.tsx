import { useState } from 'react';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import { useB3Lang } from '@/lib/lang';
import { endUserMasqueradingCompany, startUserMasqueradingCompany } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
import b2bLogger from '@/utils/b3Logger';
import { deleteCartData } from '@/utils/cartUtils';

interface B2BSwitchCompanyModalPropsTypes {
  open: boolean;
  title: string;
  fullWidth?: boolean;
  tipText: string;
  setIsOpenSwitchCompanyModal: (value: boolean) => void;
  switchCompanyId: string | number | undefined;
  rightSizeBtn?: string;
}

function B2BSwitchCompanyModal(props: B2BSwitchCompanyModalPropsTypes) {
  const {
    open,
    title,
    fullWidth = true,
    tipText,
    setIsOpenSwitchCompanyModal,
    switchCompanyId = 0,
    rightSizeBtn = '',
  } = props;
  const b3Lang = useB3Lang();

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { companyHierarchyList } = useAppSelector(({ company }) => company.companyHierarchyInfo);

  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsOpenSwitchCompanyModal(false);
  };

  const handleSwitchCompanyClick = async () => {
    setLoading(true);
    try {
      if (Number(switchCompanyId) === Number(currentCompanyId)) {
        await endUserMasqueradingCompany();
      } else if (switchCompanyId) {
        await startUserMasqueradingCompany(Number(switchCompanyId));
      }

      const cartEntityId = Cookies.get('cartId');
      if (cartEntityId) {
        const deleteCartObject = deleteCartData(cartEntityId);

        await deleteCart(deleteCartObject);

        store.dispatch(setCartNumber(0));
      }

      if (switchCompanyId) {
        store.dispatch(
          setCompanyHierarchyInfoModules({
            selectCompanyHierarchyId:
              Number(switchCompanyId) === Number(currentCompanyId) ? '' : Number(switchCompanyId),
            companyHierarchyList: companyHierarchyList || [],
          }),
        );
      }
    } catch (error) {
      b2bLogger.error(error);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  return (
    <B3Dialog
      isOpen={open}
      rightSizeBtn={rightSizeBtn || b3Lang('global.B2BSwitchCompanyModal.confirm.button')}
      title={title || b3Lang('global.B2BSwitchCompanyModal.title')}
      fullWidth={fullWidth}
      maxWidth={false}
      loading={loading}
      handleLeftClick={handleClose}
      handRightClick={handleSwitchCompanyClick}
      dialogWidth="480px"
      dialogSx={{
        '& .MuiPaper-elevation': {
          '& h2': {
            border: 'unset',
            color: '#000000',
          },
          '& div': {
            border: 'unset',
          },
        },
      }}
    >
      <Box
        sx={{
          maxHeight: '600px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            color: '#000000',
            fontSize: '14px',
            fontWeight: 400,
          }}
        >
          {tipText}
        </Box>
      </Box>
    </B3Dialog>
  );
}

export default B2BSwitchCompanyModal;
