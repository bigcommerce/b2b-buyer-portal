import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import { PAGES_SUBSIDIARIES_PERMISSION_KEYS } from '@/constants';
import { useB3Lang } from '@/lib/lang';
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
import { buildHierarchy, flattenBuildHierarchyCompanies } from '@/utils/b3Company';
import { snackbar } from '@/utils/b3Tip';
import { deleteCartData } from '@/utils/cartUtils';
import { CompanyStatusKey, isCompanyError } from '@/utils/companyUtils';

const COMPANY_STATUS_MAPPINGS: Record<CompanyStatusKey, string> = {
  pendingApprovalToViewPrices:
    'global.statusNotifications.willGainAccessToBusinessFeatProductsAndPricingAfterApproval',
  pendingApprovalToOrder:
    'global.statusNotifications.productsPricingAndOrderingWillBeEnabledAfterApproval',
  pendingApprovalToAccessFeatures:
    'global.statusNotifications.willGainAccessToBusinessFeatAfterApproval',
  accountInactive: 'global.statusNotifications.businessAccountInactive',
};

interface HierarchyDialogProps {
  open: boolean;
  handleClose: () => void;
  currentRow: Partial<CompanyHierarchyProps> | null;
  companyHierarchyAllList?: CompanyHierarchyListProps[] | [];
  title?: string;
  context?: string;
  dialogParams?: Record<string, string>;
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
  const isMasquerading = useRef<boolean>(false);

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { pagesSubsidiariesPermission } = useAppSelector(({ company }) => company);

  const { isHasCurrentPagePermission, companyHierarchyAllList: allList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const [loading, setLoading] = useState<boolean>(false);

  const handleSwitchCompanyClick = async () => {
    if (!currentRow) {
      return;
    }

    try {
      setLoading(true);

      const cartEntityId = Cookies.get('cartId');

      const { companyId } = currentRow;

      if (!companyId) {
        return;
      }

      if (companyId === Number(currentCompanyId)) {
        await endUserMasqueradingCompany();
        isMasquerading.current = false;
      } else if (companyId) {
        await startUserMasqueradingCompany(Number(companyId));
        isMasquerading.current = true;
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
      if (isCompanyError(error)) {
        snackbar.error(b3Lang(COMPANY_STATUS_MAPPINGS[error.reason]));
      } else if (error instanceof Error) {
        snackbar.error(error.message);
      }

      isMasquerading.current = false;
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const onExited = () => {
    if (!currentRow) {
      return;
    }

    const { companyId } = currentRow;

    if (companyId === Number(currentCompanyId)) {
      const { hash } = window.location;

      if (hash.includes('/shoppingList/')) {
        navigate('/shoppingLists');
      }
    }

    if (!isMasquerading.current) {
      return;
    }

    if (companyId !== Number(currentCompanyId) && !isHasCurrentPagePermission) {
      const key = Object.keys(pagesSubsidiariesPermission).find((key) =>
        Boolean(pagesSubsidiariesPermission[key as keyof PagesSubsidiariesPermissionProps]),
      );

      const route = PAGES_SUBSIDIARIES_PERMISSION_KEYS.find((item) => item.key === key);

      if (route) {
        handleClose();
        setLoading(false);
        navigate(route.path);
      }
    }
  };

  return (
    <B3Dialog
      dialogSx={{
        '& .MuiDialogTitle-root': {
          border: 0,
        },
        '& .MuiDialogActions-root': {
          border: 0,
        },
      }}
      fullWidth
      handRightClick={handleSwitchCompanyClick}
      handleLeftClick={handleClose}
      isOpen={open}
      loading={loading}
      restDialogParams={{ TransitionProps: { onExited } }}
      rightSizeBtn={b3Lang('global.button.next')}
      title={title || b3Lang('companyHierarchy.dialog.title')}
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
