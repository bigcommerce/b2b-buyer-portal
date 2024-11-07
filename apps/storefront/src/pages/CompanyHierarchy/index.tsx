import { useEffect, useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import B3Spin from '@/components/spin/B3Spin';
import useMobile from '@/hooks/useMobile';
import { getCompanySubsidiaries } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
import { CompanyHierarchyListProps, CompanyHierarchyProps } from '@/types';
import { buildHierarchy } from '@/utils';
import { deleteCartData } from '@/utils/cartUtils';

import CompanyHierarchyTableTree from './components/TableTree';

function CompanyHierarchy() {
  const [data, setData] = useState<CompanyHierarchyProps[]>([]);

  const [open, setOpen] = useState<boolean>(false);

  const [currentRow, setCurrentRow] = useState<CompanyHierarchyProps | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const originDataRef = useRef<CompanyHierarchyListProps[]>([]);

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const init = async () => {
    setLoading(true);

    const { companySubsidiaries } = await getCompanySubsidiaries();

    const list = buildHierarchy(companySubsidiaries || [], +currentCompanyId);

    originDataRef.current = companySubsidiaries;

    setData(list);

    setLoading(false);
  };

  useEffect(() => {
    if (currentCompanyId) {
      init();
    }

    // ignore init
    // due they are funtions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompanyId]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleRowClick = (row: CompanyHierarchyProps) => {
    setCurrentRow(row);
    setOpen(true);
  };

  const handleSwitchCompanyClick = async () => {
    if (!currentRow) return;

    setLoading(true);

    const cartEntityId = Cookies.get('cartId');

    if (cartEntityId) {
      const deleteCartObject = deleteCartData(cartEntityId);

      await deleteCart(deleteCartObject);

      store.dispatch(setCartNumber(0));
    }

    const { companyId } = currentRow;

    store.dispatch(
      setCompanyHierarchyInfoModules({
        selectCompanyHierarchyId: companyId === +currentCompanyId ? '' : companyId,
        companyHierarchyList: originDataRef?.current || [],
      }),
    );

    setLoading(false);

    handleClose();
  };

  return (
    <B3Spin isSpinning={loading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
        }}
      >
        <CompanyHierarchyTableTree<CompanyHierarchyProps>
          data={data}
          onSwitchCompany={handleRowClick}
          currentCompanyId={currentCompanyId}
          selectCompanyId={selectCompanyHierarchyId}
        />

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
      </Box>
    </B3Spin>
  );
}

export default CompanyHierarchy;
