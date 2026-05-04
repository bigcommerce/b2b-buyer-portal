import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { B2BAutoCompleteCheckbox } from '@/components/ui/B2BAutoCompleteCheckbox';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { PageInfo } from '@/shared/service/bc/graphql/base';
import {
  getCustomerOrders,
  OrdersFiltersInput,
  OrdersSortInput,
} from '@/shared/service/bc/graphql/orders';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { currencyFormat, ordersCurrencyFormat } from '@/utils/b3CurrencyFormat';
import { displayFormat } from '@/utils/b3DateFormat';

import OrderStatus from './components/OrderStatus';
import { B3Table, PossibleNodeWrapper, TableColumnItem } from './table/B3Table';
import { adaptUnifiedToLegacyFilterParams } from './adaptUnifiedToLegacyFilterParams';
import {
  FilterSearchProps,
  getFilterMoreData,
  getOrderStatusText,
  translateFilterMoreData,
} from './config';
import { type ListItem, mapSfGqlOrderToListItem } from './mapSfGqlOrderToListItem';
import { OrderItemCard } from './OrderItemCard';
import {
  getB2BAllOrders,
  getBCAllOrders,
  getBcOrderStatusType,
  getCreatedByUserForOrders,
  getOrderStatusType,
} from './orders';
import { useCustomerOrdersState } from './useCustomerOrdersState';
import { useLegacyOrdersFilterState } from './useLegacyOrdersFilterState';

interface OrderProps {
  isCompanyOrder?: boolean;
}

function useData() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id);
  const role = useAppSelector(({ company }) => company.customer.role);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const { order: orderSubViewPermission } = useAppSelector(
    ({ company }) => company.pagesSubsidiariesPermission,
  );

  const { selectCompanyHierarchyId, isEnabledCompanyHierarchy } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const currentCompanyId =
    role === CustomerRole.SUPER_ADMIN && isAgenting
      ? Number(salesRepCompanyId)
      : Number(companyB2BId);

  const companyId = companyB2BId || salesRepCompanyId;

  return {
    role,
    isAgenting,
    isB2BUser,
    isEnabledCompanyHierarchy: isEnabledCompanyHierarchy && orderSubViewPermission,
    selectedCompanyId: Number(selectCompanyHierarchyId) || currentCompanyId,
    companyId,
  };
}

const getEmail = (haystack: string = '') => {
  const getEmailReg = /\((.+)\)/g;
  const emailRegArr = getEmailReg.exec(haystack);

  return emailRegArr?.length ? emailRegArr[1] : '';
};

const getName = (haystack: string = '') => {
  const getCreatedByReg = /^[^(]+/;
  const createdByUserRegArr = getCreatedByReg.exec(haystack);
  return createdByUserRegArr?.length ? createdByUserRegArr[0].trim() : '';
};

function Order({ isCompanyOrder = false }: OrderProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const isUnifiedOrders = useFeatureFlag('B2B-4613.buyer_portal_unified_sf_gql_orders');
  const { role, isAgenting, companyId, isB2BUser, isEnabledCompanyHierarchy, selectedCompanyId } =
    useData();

  const [legacyPagination, setLegacyPagination] = useState({ offset: 0, first: 10 });

  const [allTotal, setAllTotal] = useState(0);
  const [filterMoreInfo, setFilterMoreInfo] = useState<Array<any>>([]);
  const [getOrderStatuses, setOrderStatuses] = useState<Array<any>>([]);

  const isUnifiedOrdersNonCompanyOrderPath = isUnifiedOrders && !isCompanyOrder;

  const legacyFilterState = useLegacyOrdersFilterState({
    isB2BUser,
    isCompanyOrder,
    selectedCompanyId,
    orderStatuses: getOrderStatuses,
  });
  const customerFilterState = useCustomerOrdersState({
    companyId: selectedCompanyId,
    orderStatuses: getOrderStatuses,
    isCompanyOrder,
  });

  const {
    activeSort,
    handleSearchChange,
    handleFilterChange,
    handleCompanyIdsChange,
    handleSetOrderBy,
  } = isUnifiedOrdersNonCompanyOrderPath ? customerFilterState : legacyFilterState;

  const { filterData, orderBy } = isUnifiedOrdersNonCompanyOrderPath
    ? adaptUnifiedToLegacyFilterParams({
        filters: customerFilterState.filters,
        activeSort: customerFilterState.activeSort,
        isB2BUser,
      })
    : { filterData: legacyFilterState.filterData, orderBy: legacyFilterState.orderBy };

  useEffect(() => {
    // TODO: Guest customer should not be able to see the order list
    if (role === CustomerRole.GUEST) return;

    const initFilter = async () => {
      const createdByUsers =
        isB2BUser && isCompanyOrder ? await getCreatedByUserForOrders(Number(companyId)) : {};
      //  Caution: This api hasn't yet been ported to unified order api
      const orderStatuses = isB2BUser ? await getOrderStatusType() : await getBcOrderStatusType();
      setOrderStatuses(orderStatuses);

      /* 
        returns what all fields to show in more filter (funnel icon)
        and styles associated to those fields
      */
      setFilterMoreInfo(
        translateFilterMoreData(
          getFilterMoreData(
            isB2BUser,
            role,
            isCompanyOrder,
            isAgenting,
            createdByUsers,
            orderStatuses,
          ),
          b3Lang,
        ),
      );
    };

    initFilter();
  }, [b3Lang, companyId, isAgenting, isB2BUser, isCompanyOrder, role]);

  const fetchUnifiedOrders = async (args: {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
    filters: OrdersFiltersInput;
    sortBy: OrdersSortInput;
  }): Promise<{
    edges: ListItem[];
    totalCount: number;
    pageInfo: PageInfo | null;
  }> => {
    const result = await getCustomerOrders(args);
    const orders = result.data?.customer?.orders;
    const edges = (orders?.edges || []).map((edge) => mapSfGqlOrderToListItem(edge.node));
    const pageInfo = orders?.pageInfo ?? null;

    return { edges, totalCount: -1, pageInfo };
  };

  const fetchLegacyOrders = async ({
    createdBy,
    ...params
  }: Partial<FilterSearchProps>): Promise<{ edges: ListItem[]; totalCount: number }> => {
    const { edges = [], totalCount } = isB2BUser
      ? await getB2BAllOrders({
          ...params,
          email: getEmail(createdBy),
          createdBy: getName(createdBy),
        })
      : await getBCAllOrders(params);

    setAllTotal(totalCount);

    return {
      edges: edges.map((row: PossibleNodeWrapper<object>) => ('node' in row ? row.node : row)),
      totalCount,
    };
  };

  const navigate = useNavigate();

  const goToDetail = (item: ListItem, index: number) => {
    navigate(`/orderDetail/${item.orderId}`, {
      state: {
        currentIndex: index,
        searchParams: {
          ...filterData,
          orderBy,
        },
        totalCount: isUnifiedOrdersNonCompanyOrderPath ? -1 : allTotal,
        isCompanyOrder,
        beginDateAt: filterData?.beginDateAt,
        endDateAt: filterData?.endDateAt,
      },
    });
  };

  const columnAllItems = [
    {
      key: 'orderId',
      title: b3Lang('orders.order'),
      width: '10%',
      isSortable: true,
      render: ({ orderId }) => orderId,
    },
    {
      key: 'companyName',
      title: b3Lang('orders.company'),
      width: '10%',
      isSortable: false,
      render: ({ companyInfo }) => {
        return <Box>{companyInfo?.companyName || '–'}</Box>;
      },
    },
    {
      key: 'poNumber',
      title: b3Lang('orders.poReference'),
      render: ({ poNumber }) => <Box>{poNumber || '–'}</Box>,
      width: '10%',
      isSortable: true,
    },
    {
      key: 'totalIncTax',
      title: b3Lang('orders.grandTotal'),
      render: ({ money, totalIncTax }) =>
        money
          ? ordersCurrencyFormat(JSON.parse(JSON.parse(money)), totalIncTax)
          : currencyFormat(totalIncTax),
      align: 'right',
      width: '8%',
      isSortable: true,
    },
    {
      key: 'status',
      title: b3Lang('orders.orderStatus'),
      render: ({ status, statusText }) => <OrderStatus text={statusText} code={status} />,
      width: '10%',
      isSortable: true,
    },
    {
      key: 'placedBy',
      title: b3Lang('orders.placedBy'),
      render: ({ firstName, lastName }) => `${firstName} ${lastName}`,
      width: '10%',
      isSortable: true,
    },
    {
      key: 'createdAt',
      title: b3Lang('orders.createdOn'),
      render: ({ createdAt }) => `${displayFormat(Number(createdAt))}`,
      width: '10%',
      isSortable: true,
    },
  ] as const satisfies TableColumnItem<ListItem>[];

  const getColumnItems = (): TableColumnItem<ListItem>[] => {
    const getNewColumnItems = columnAllItems.filter((item) => {
      const { key } = item;
      if (!isB2BUser && key === 'companyName') return false;
      if ((!isB2BUser || (Number(role) === 3 && !isAgenting)) && key === 'placedBy') return false;

      if (key === 'placedBy' && !(Number(role) === 3 && !isAgenting) && !isCompanyOrder) {
        return false;
      }
      return true;
    });

    return getNewColumnItems;
  };

  const columnItems = getColumnItems();

  const { data, isFetching, dataUpdatedAt } = useQuery({
    queryKey: isUnifiedOrdersNonCompanyOrderPath
      ? [
          'orderList:unified',
          customerFilterState.filters,
          customerFilterState.sortBy,
          customerFilterState.paginationVariables,
        ]
      : ['orderList:legacy', filterData, legacyPagination, orderBy],
    enabled: isUnifiedOrdersNonCompanyOrderPath ? true : Boolean(filterData),
    queryFn: () =>
      isUnifiedOrdersNonCompanyOrderPath
        ? fetchUnifiedOrders({
            ...customerFilterState.paginationVariables,
            filters: customerFilterState.filters,
            sortBy: customerFilterState.sortBy,
          })
        : fetchLegacyOrders({ ...filterData, ...legacyPagination, orderBy }),
  });

  useEffect(() => {
    if (!data || !isUnifiedOrdersNonCompanyOrderPath) return;
    const pageInfo = 'pageInfo' in data ? (data as { pageInfo: PageInfo | null }).pageInfo : null;
    if (pageInfo) customerFilterState.updatePageInfo(pageInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt, isUnifiedOrdersNonCompanyOrderPath]);

  const listItems = useMemo(
    () =>
      (data?.edges ?? []).map((edge) => ({
        ...edge,
        statusText: getOrderStatusText(edge.status, getOrderStatuses),
      })),
    [data?.edges, getOrderStatuses],
  );

  return (
    <B3Spin isSpinning={isFetching}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',

            '& > div': {
              width: isMobile ? '100%' : 'auto',
            },
          }}
        >
          {isEnabledCompanyHierarchy && (
            <Box sx={{ mr: isMobile ? 0 : '10px', mb: '30px' }}>
              <B2BAutoCompleteCheckbox handleChangeCompanyIds={handleCompanyIdsChange} />
            </Box>
          )}
          <B3Filter
            startPicker={{
              isEnabled: true,
              label: b3Lang('orders.from'),
              defaultValue: filterData?.beginDateAt || null,
              pickerKey: 'start',
            }}
            endPicker={{
              isEnabled: true,
              label: b3Lang('orders.to'),
              defaultValue: filterData?.endDateAt || null,
              pickerKey: 'end',
            }}
            filterMoreInfo={filterMoreInfo}
            handleChange={handleSearchChange}
            handleFilterChange={handleFilterChange}
            pcTotalWidth="100%"
            pcContainerWidth="100%"
            pcSearchContainerWidth="100%"
          />
        </Box>

        <B3Table
          columnItems={columnItems}
          listItems={listItems}
          pagination={
            isUnifiedOrdersNonCompanyOrderPath
              ? customerFilterState.b3TablePaginationProps.pagination
              : { ...legacyPagination, count: data?.totalCount || 0 }
          }
          cursorPageInfo={
            isUnifiedOrdersNonCompanyOrderPath
              ? customerFilterState.b3TablePaginationProps.cursorPageInfo
              : undefined
          }
          onPaginationChange={
            isUnifiedOrdersNonCompanyOrderPath
              ? customerFilterState.b3TablePaginationProps.onPaginationChange
              : setLegacyPagination
          }
          isInfiniteScroll={isMobile}
          renderItem={(row, index) => (
            <OrderItemCard key={row.orderId} goToDetail={() => goToDetail(row, index)} item={row} />
          )}
          onClickRow={goToDetail}
          sortDirection={activeSort.dir}
          sortByFn={handleSetOrderBy}
          orderBy={activeSort.key}
        />
      </Box>
    </B3Spin>
  );
}

export default Order;
