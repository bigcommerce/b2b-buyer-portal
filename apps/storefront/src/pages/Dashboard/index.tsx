import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';

import { usePageMask } from '@/components';
import B3FilterSearch from '@/components/filter/B3FilterSearch';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { useSort } from '@/hooks';
import { superAdminCompanies } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { endMasquerade, startMasquerade } from '@/utils/masquerade';

import { type PageProps } from '../PageProps';

import { ActionMenuCell } from './ActionMenuCell';
import { CompanyNameCell } from './CompanyNameCell';
import { DashboardCard } from './DashboardCard';

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

  const { salesRepCompanyId, b2bId, customerId } = useData();

  const { setOpenPage } = props;
  const b3Lang = useB3Lang();

  const [isRequestLoading, setIsRequestLoading] = useState(false);

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

  const getSuperAdminCompaniesList = async (params: ListItem) => {
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
        await startMasquerade({ customerId, companyId });
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
        await endMasquerade();
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
            onClick={() => startActing(Number(companyId))}
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
          renderItem={(row: ListItem) => (
            <DashboardCard
              row={row}
              startActing={startActing}
              endActing={endActing}
              salesRepCompanyId={Number(salesRepCompanyId)}
            />
          )}
        />
      </Box>
    </B3Spin>
  );
}

export default Dashboard;
