import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import { usePageMask } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import B3FilterSearch from '@/components/filter/B3FilterSearch';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { useSort } from '@/hooks';
import { PageProps } from '@/pages/PageProps';
import { superAdminCompanies } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { setCartNumber, useAppSelector, useAppStore } from '@/store';
import { endMasquerade, startMasquerade } from '@/utils/masquerade';

import { DashboardCard } from './components/DashboardCard';
import { ActionMenuCell } from './ActionMenuCell';
import { CompanyNameCell } from './CompanyNameCell';

interface ListItem {
  [key: string]: string;
}

export const defaultSortKey = 'companyName';

export const sortKeys = {
  companyName: 'companyName',
  companyAdminName: 'companyAdminName',
  companyEmail: 'companyEmail',
};

const rowsPerPage = [10, 20, 30];

function useData() {
  const customerId = useAppSelector(({ company }) => company.customer.id);
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);
  const salesRepCompanyId = Number(
    useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id),
  );

  return { salesRepCompanyId, b2bId, customerId };
}

function Dashboard(props: PageProps) {
  const showPageMask = usePageMask();
  const store = useAppStore();

  const { salesRepCompanyId, b2bId, customerId } = useData();

  const { setOpenPage } = props;
  const b3Lang = useB3Lang();

  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [tempCompanyId, setTempCompanyId] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  const [filterData, setFilterData] = useState<ListItem>({
    q: '',
    orderBy: sortKeys[defaultSortKey],
  });

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortKeys,
    defaultSortKey,
    filterData,
    setFilterData,
    'asc',
  );

  const location = useLocation();

  const getSuperAdminCompaniesList: GetRequestList<ListItem, ListItem> = async (params) => {
    let list = { edges: [], totalCount: 0 };
    if (typeof b2bId === 'number') {
      list = (await superAdminCompanies(b2bId, params)).superAdminCompanies;
    }

    return list;
  };

  const startActing = async (companyId: number) => {
    try {
      setIsRequestLoading(true);
      if (typeof b2bId === 'number') {
        await startMasquerade({ customerId, companyId }, store);
      }

      setOpenPage({
        isOpen: true,
        openUrl: '/dashboard',
      });

      setFilterData({
        ...filterData,
      });
    } finally {
      setIsRequestLoading(false);
    }
  };

  const endActing = async () => {
    try {
      showPageMask(true);
      if (typeof b2bId === 'number') {
        await endMasquerade(store);
      }
      setFilterData({
        ...filterData,
      });
    } finally {
      showPageMask(false);
    }
  };

  useEffect(() => {
    const params = {
      ...location,
    };
    if (params?.state) {
      endActing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleChange = async (q: string) => {
    setFilterData({
      ...filterData,
      q,
    });
  };

  const handleClose = () => {
    setOpenModal(false);
  };

  const handleModalConfirm = () => {
    const cartId = Cookies.get('cartId');

    startActing(Number(tempCompanyId))
      .then(() => deleteCart({ deleteCartInput: { cartEntityId: cartId as string } }))
      .then(() => Cookies.remove('cartId'))
      .finally(() => {
        store.dispatch(setCartNumber(0));
        handleClose();
      });
  };

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'companyName',
      title: b3Lang('dashboard.company'),
      render: ({ companyName, companyId }) => (
        <CompanyNameCell
          companyName={companyName}
          isSelected={Number(companyId) === Number(salesRepCompanyId)}
        />
      ),
      isSortable: true,
    },
    {
      key: 'companyEmail',
      title: b3Lang('dashboard.email'),
      isSortable: true,
    },
    {
      key: 'actions',
      title: b3Lang('dashboard.action'),
      render: ({ companyId }) => {
        const isSelected = Number(companyId) === Number(salesRepCompanyId);

        if (isSelected) {
          return (
            <ActionMenuCell
              label={b3Lang('dashboard.endMasqueradeAction')}
              onClick={() => endActing()}
            />
          );
        }

        return (
          <ActionMenuCell
            label={b3Lang('dashboard.masqueradeAction')}
            onClick={() => {
              const cartId = Cookies.get('cartId');
              if (cartId) {
                setOpenModal(true);
                setTempCompanyId(Number(companyId));
              } else {
                startActing(Number(companyId));
              }
            }}
          />
        );
      },
    },
  ];

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <Box
          sx={{
            mb: '24px',
          }}
        >
          <B3FilterSearch handleChange={handleChange} />
        </Box>
        <B3PaginationTable
          columnItems={columnItems}
          rowsPerPageOptions={rowsPerPage}
          getRequestList={getSuperAdminCompaniesList}
          searchParams={filterData || {}}
          isCustomRender={false}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          renderItem={({ companyName, companyEmail, companyId }) => {
            const isSelected = Number(companyId) === Number(salesRepCompanyId);
            const action = isSelected
              ? {
                  label: b3Lang('dashboard.endMasqueradeAction'),
                  onClick: () => {
                    endActing();
                  },
                }
              : {
                  label: b3Lang('dashboard.masqueradeAction'),
                  onClick: () => {
                    startActing(Number(companyId));
                  },
                };

            return (
              <DashboardCard
                companyName={companyName}
                email={companyEmail}
                isSelected={isSelected}
                action={action}
              />
            );
          }}
        />
      </Box>
      <B3Dialog
        isOpen={openModal}
        rightSizeBtn={b3Lang('dashboard.startMasqueradeModal.actions.continue')}
        title={b3Lang('dashboard.startMasqueradeModal.title')}
        leftSizeBtn={b3Lang('dashboard.startMasqueradeModal.actions.cancel')}
        maxWidth={false}
        loading={isRequestLoading}
        handleLeftClick={handleClose}
        handRightClick={handleModalConfirm}
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
            {b3Lang('dashboard.startMasqueradeModal.message')}
          </Box>
        </Box>
      </B3Dialog>
    </B3Spin>
  );
}

export default Dashboard;
