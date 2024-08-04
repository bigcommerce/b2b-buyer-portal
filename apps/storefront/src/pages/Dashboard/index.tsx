import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

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

import DashboardCard from './components/DashboardCard';

interface ListItem {
  [key: string]: string;
}

interface B3MeanProps {
  isMasquerade: boolean;
  handleSelect: () => void;
  startActing: () => void;
  endActing: () => void;
}

export const defaultSortKey = 'companyName';

export const sortKeys = {
  companyName: 'companyName',
  companyAdminName: 'companyAdminName',
  companyEmail: 'companyEmail',
};

const StyledMenu = styled(Menu)(() => ({
  '& .MuiPaper-elevation': {
    boxShadow:
      '0px 1px 0px -1px rgba(0, 0, 0, 0.1), 0px 1px 6px rgba(0, 0, 0, 0.07), 0px 1px 4px rgba(0, 0, 0, 0.06)',
    borderRadius: '4px',
  },
}));

function B3Mean({ isMasquerade, handleSelect, startActing, endActing }: B3MeanProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const b3Lang = useB3Lang();

  const handleOpen = () => {
    handleSelect();
    setIsOpen(true);
  };

  const menuItemText = isMasquerade
    ? b3Lang('dashboard.endMasqueradeAction')
    : b3Lang('dashboard.masqueradeAction');

  return (
    <>
      <IconButton onClick={handleOpen} ref={ref}>
        <MoreHorizIcon />
      </IconButton>
      <StyledMenu
        id="basic-menu"
        anchorEl={ref.current}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          sx={{
            color: 'primary.main',
          }}
          onClick={() => {
            if (isMasquerade) {
              endActing();
            } else {
              startActing();
            }

            setIsOpen(false);
          }}
        >
          {menuItemText}
        </MenuItem>
      </StyledMenu>
    </>
  );
}

function Dashboard(props: PageProps) {
  const showPageMask = usePageMask();

  const customerId = useAppSelector(({ company }) => company.customer.id);
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);

  const { setOpenPage } = props;
  const b3Lang = useB3Lang();

  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);

  const [currentSalesRepCompanyId, setCurrentSalesRepCompanyId] = useState<number>(
    +salesRepCompanyId,
  );

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

  const startActing = async (id?: number) => {
    try {
      setIsRequestLoading(true);
      if (typeof b2bId === 'number') {
        await startMasquerade({
          customerId,
          companyId: id || currentSalesRepCompanyId,
          b2bId,
        });
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
        await endMasquerade({
          b2bId,
        });
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
      render: (row: CustomFieldItems) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {row.companyName}
          {row.companyId === +salesRepCompanyId && (
            <Box
              sx={{
                fontWeight: 400,
                fontSize: '13px',
                background: '#ED6C02',
                ml: '16px',
                p: '2px 7px',
                color: '#FFFFFF',
                borderRadius: '10px',
              }}
            >
              {b3Lang('dashboard.selected')}
            </Box>
          )}
        </Box>
      ),
      isSortable: true,
    },
    {
      key: 'companyEmail',
      title: b3Lang('dashboard.email'),
      isSortable: true,
    },
    {
      key: 'companyName',
      title: b3Lang('dashboard.action'),
      render: (row: CustomFieldItems) => {
        const { companyId } = row;
        const isMasquerade = +companyId === +salesRepCompanyId;

        return (
          <B3Mean
            isMasquerade={isMasquerade}
            handleSelect={() => {
              setCurrentSalesRepCompanyId(companyId);
            }}
            startActing={startActing}
            endActing={endActing}
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
          rowsPerPageOptions={[10, 20, 30]}
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
              salesRepCompanyId={+salesRepCompanyId}
            />
          )}
        />
      </Box>
    </B3Spin>
  );
}

export default Dashboard;
