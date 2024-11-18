import { useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import useMobile from '@/hooks/useMobile';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
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
    switchCompanyId,
    rightSizeBtn = '',
  } = props;
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { companyHierarchyList } = useAppSelector(({ company }) => company.companyHierarchyInfo);

  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsOpenSwitchCompanyModal(false);
  };

  const handleSwitchCompanyClick = async () => {
    setLoading(true);

    const cartEntityId = Cookies.get('cartId');

    if (cartEntityId) {
      const deleteCartObject = deleteCartData(cartEntityId);

      await deleteCart(deleteCartObject);

      store.dispatch(setCartNumber(0));
    }

    if (switchCompanyId) {
      store.dispatch(
        setCompanyHierarchyInfoModules({
          selectCompanyHierarchyId: +switchCompanyId === +currentCompanyId ? '' : +switchCompanyId,
          companyHierarchyList: companyHierarchyList || [],
        }),
      );
    }

    handleClose();
    setLoading(false);
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
      dialogSx={{
        '& .MuiPaper-elevation': {
          width: isMobile ? '100%' : `480px`,
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
          }}
        >
          {tipText}
        </Box>
      </Box>
    </B3Dialog>
  );
}

export default B2BSwitchCompanyModal;
