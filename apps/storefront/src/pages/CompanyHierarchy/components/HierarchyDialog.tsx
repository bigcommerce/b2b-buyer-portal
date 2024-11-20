import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import { PATH_ROUTES } from '@/constants';
import useMobile from '@/hooks/useMobile';
import { endUserMasqueradingCompany, startUserMasqueradingCompany } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
import { CompanyHierarchyListProps, CompanyHierarchyProps } from '@/types';
import b2bLogger from '@/utils/b3Logger';
import { deleteCartData } from '@/utils/cartUtils';

interface HierarchyDialogProps {
  open: boolean;
  loading: boolean;
  handleClose: () => void;
  currentRow: Partial<CompanyHierarchyProps> | null;
  setLoading: (bool: boolean) => void;
  companyHierarchyAllList?: CompanyHierarchyListProps[] | [];
}
function HierarchyDialog({
  open = false,
  loading = false,
  handleClose,
  currentRow,
  setLoading,
  companyHierarchyAllList,
}: HierarchyDialogProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const navigate = useNavigate();

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { ishasCurrentPagePermission } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const handleSwitchCompanyClick = async () => {
    if (!currentRow) return;
    try {
      setLoading(true);

      const cartEntityId = Cookies.get('cartId');

      const { companyId } = currentRow;

      if (companyId === +currentCompanyId) {
        await endUserMasqueradingCompany();
      } else if (companyId) {
        await startUserMasqueradingCompany(+companyId);
      }

      if (cartEntityId) {
        const deleteCartObject = deleteCartData(cartEntityId);

        await deleteCart(deleteCartObject);

        store.dispatch(setCartNumber(0));
      }

      if (companyHierarchyAllList) {
        store.dispatch(
          setCompanyHierarchyInfoModules({
            selectCompanyHierarchyId: companyId === +currentCompanyId ? '' : companyId,
            companyHierarchyAllList,
          }),
        );
      } else {
        store.dispatch(
          setCompanyHierarchyInfoModules({
            selectCompanyHierarchyId: companyId === +currentCompanyId ? '' : companyId,
          }),
        );
      }

      if (companyId !== +currentCompanyId && !ishasCurrentPagePermission) {
        navigate(PATH_ROUTES.COMPANY_HIERARCHY);
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
      rightSizeBtn="Continue"
      title={b3Lang('companyHierarchy.dialog.title')}
      fullWidth
      maxWidth={false}
      loading={loading}
      handleLeftClick={handleClose}
      handRightClick={handleSwitchCompanyClick}
      dialogSx={{
        '& .MuiPaper-elevation': {
          width: isMobile ? '100%' : `480px`,
        },
        '& .MuiDialogTitle-root': {
          border: 0,
        },
        '& .MuiDialogActions-root': {
          border: 0,
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
          {b3Lang('companyHierarchy.dialog.content')}
        </Box>
      </Box>
    </B3Dialog>
  );
}

export default HierarchyDialog;
