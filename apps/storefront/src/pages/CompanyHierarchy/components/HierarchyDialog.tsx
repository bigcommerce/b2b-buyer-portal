import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import { PAGES_SUBSIDIARIES_PERMISSION_KEYS } from '@/constants';
import { endUserMasqueradingCompany, startUserMasqueradingCompany } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
import {
  CompanyHierarchyListProps,
  CompanyHierarchyProps,
  PagesSubsidiariesPermissionProps,
} from '@/types';
import { buildHierarchy, flattenBuildHierarchyCompanies } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { deleteCartData } from '@/utils/cartUtils';

interface HierarchyDialogProps {
  open: boolean;
  handleClose: () => void;
  currentRow: Partial<CompanyHierarchyProps> | null;
  companyHierarchyAllList?: CompanyHierarchyListProps[] | [];
  title?: string;
  context?: string;
  dialogParams?: { [key: string]: string };
}
function HierarchyDialog({
  open = false,
  handleClose,
  currentRow,
  companyHierarchyAllList,
  title,
  context,
  dialogParams = {},
}: HierarchyDialogProps) {
  const b3Lang = useB3Lang();
  const navigate = useNavigate();

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { pagesSubsidiariesPermission } = useAppSelector(({ company }) => company);

  const { isHasCurrentPagePermission, companyHierarchyAllList: allList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const [loading, setLoading] = useState<boolean>(false);

  const handleSwitchCompanyClick = async () => {
    if (!currentRow) return;
    try {
      setLoading(true);

      const cartEntityId = Cookies.get('cartId');

      const { companyId } = currentRow;

      if (!companyId) return;

      if (companyId === Number(currentCompanyId)) {
        await endUserMasqueradingCompany();
      } else if (companyId) {
        await startUserMasqueradingCompany(Number(companyId));
      }

      if (cartEntityId) {
        const deleteCartObject = deleteCartData(cartEntityId);

        await deleteCart(deleteCartObject);

        store.dispatch(setCartNumber(0));
      }

      const selectCompanyHierarchyId = companyId === Number(currentCompanyId) ? '' : companyId;

      const buildData = companyHierarchyAllList || allList;

      store.dispatch(
        setCompanyHierarchyInfoModules({
          selectCompanyHierarchyId,
          ...(companyHierarchyAllList && { companyHierarchyAllList }),
          companyHierarchySelectSubsidiariesList: flattenBuildHierarchyCompanies(
            buildHierarchy({
              data: buildData,
              companyId,
            })[0],
          ),
        }),
      );
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
      rightSizeBtn={b3Lang('global.button.next')}
      title={title || b3Lang('companyHierarchy.dialog.title')}
      fullWidth
      loading={loading}
      handleLeftClick={handleClose}
      handRightClick={handleSwitchCompanyClick}
      restDialogParams={{
        TransitionProps: {
          onExited: () => {
            if (!currentRow) return;
            const { companyId } = currentRow;
            if (companyId === Number(currentCompanyId)) {
              const { hash } = window.location;
              if (hash.includes('/shoppingList/')) {
                navigate('/shoppingLists');
              }
            }
            if (companyId !== Number(currentCompanyId) && !isHasCurrentPagePermission) {
              const key = Object.keys(pagesSubsidiariesPermission).find((key) => {
                return !!pagesSubsidiariesPermission[key as keyof PagesSubsidiariesPermissionProps];
              });

              const route = PAGES_SUBSIDIARIES_PERMISSION_KEYS.find((item) => item.key === key);

              if (route) {
                handleClose();
                setLoading(false);
                navigate(route.path);
              }
            }
          },
        },
      }}
      dialogSx={{
        '& .MuiDialogTitle-root': {
          border: 0,
        },
        '& .MuiDialogActions-root': {
          border: 0,
        },
      }}
      {...dialogParams}
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
          {context || b3Lang('companyHierarchy.dialog.content')}
        </Box>
      </Box>
    </B3Dialog>
  );
}

export default HierarchyDialog;
