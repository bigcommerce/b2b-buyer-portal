import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import B3Dialog from '@/components/B3Dialog';
import B3Spin from '@/components/spin/B3Spin';
import useMobile from '@/hooks/useMobile';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
import { CompanyHierarchyListProps, CompanyHierarchyProps } from '@/types';
import { buildHierarchy } from '@/utils';
import { deleteCartData } from '@/utils/cartUtils';

import CompanyHierarchyTableTree from './components/TableTree';

const originData = [
  {
    companyName: 'Company 1',
    companyId: 51138,
    parentCompanyName: '',
    parentCompanyId: null,
  },
  {
    companyName: 'Company 3',
    companyId: 3,
    parentCompanyName: 'Company 1',
    parentCompanyId: 51138,
  },
  {
    companyName: 'Company12312312312dasdasdasa 2',
    companyId: 2,
    parentCompanyName: 'Company 1',
    parentCompanyId: 51138,
  },
  {
    companyName: 'Company 4',
    companyId: 4,
    parentCompanyName: 'Company 2',
    parentCompanyId: 2,
  },
];

function CompanyHierarchy() {
  const [data, setData] = useState<CompanyHierarchyProps[]>([]);

  const [open, setOpen] = useState<boolean>(false);

  const [currentRow, setCurrentRow] = useState<CompanyHierarchyProps | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [isMobile] = useMobile();

  const originDataRef = useRef<CompanyHierarchyListProps[]>([]);

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const dataArr = buildHierarchy(originData);
      originDataRef.current = originData;
      setData(dataArr);
      setLoading(false);
    }, 1000);
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
          title="Switch company"
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
              Switching to a different company will refresh your shopping cart. Do you want to
              continue?
            </Box>
          </Box>
        </B3Dialog>
      </Box>
    </B3Spin>
  );
}

export default CompanyHierarchy;
