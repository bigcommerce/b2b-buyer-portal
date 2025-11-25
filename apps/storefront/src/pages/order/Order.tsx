import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { B2BAutoCompleteCheckbox } from '@/components/ui/B2BAutoCompleteCheckbox';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { currencyFormat, ordersCurrencyFormat } from '@/utils/b3CurrencyFormat';
import { displayFormat } from '@/utils/b3DateFormat';

import OrderStatus from './components/OrderStatus';
import { orderStatusTranslationVariables } from './shared/getOrderStatus';
import { B3Table, PossibleNodeWrapper, TableColumnItem } from './table/B3Table';
import {
  assertSortKey,
  FilterSearchProps,
  getCompanyInitFilter,
  getCustomerInitFilter,
  getFilterMoreData,
  getOrderStatusText,
  sortKeys,
} from './config';
import { OrderItemCard } from './OrderItemCard';
import {
  getB2BAllOrders,
  getBCAllOrders,
  getBcOrderStatusType,
  getOrdersCreatedByUser,
  getOrderStatusType,
} from './orders';

interface CompanyInfoProps {
  companyId: string;
  companyName: string;
  companyAddress: string;
  companyCountry: string;
  companyState: string;
  companyCity: string;
  companyZipCode: string;
  phoneNumber: string;
  bcId: string;
}

interface ListItem {
  firstName: string;
  lastName: string;
  orderId: string;
  poNumber?: string;
  money?: string;
  totalIncTax: string;
  status: string;
  createdAt: string;
  companyName: string;
  companyInfo?: CompanyInfoProps;
}

interface SearchChangeProps {
  startValue?: string;
  endValue?: string;
  PlacedBy?: string;
  orderStatus?: string | number;
  company?: string;
}

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

interface OrderBy {
  key: keyof typeof sortKeys;
  dir: 'asc' | 'desc';
}

const getOrderBy = ({ key, dir }: OrderBy) => {
  return dir === 'desc' ? `-${sortKeys[key]}` : sortKeys[key];
};

function Order({ isCompanyOrder = false }: OrderProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const { role, isAgenting, companyId, isB2BUser, isEnabledCompanyHierarchy, selectedCompanyId } =
    useData();

  const [pagination, setPagination] = useState({ offset: 0, first: 10 });

  const [allTotal, setAllTotal] = useState(0);
  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>();
  const [filterInfo, setFilterInfo] = useState<Array<any>>([]);
  const [getOrderStatuses, setOrderStatuses] = useState<Array<any>>([]);

  const [orderBy, setOrderBy] = useState<OrderBy>({
    key: 'orderId',
    dir: 'desc',
  });

  const handleSetOrderBy = (key: string) => {
    setOrderBy((prev) => {
      assertSortKey(key);

      if (prev.key === key) {
        return {
          key,
          dir: prev.dir === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        dir: 'desc',
      };
    });
  };

  useEffect(() => {
    const search = isB2BUser
      ? getCompanyInitFilter(isCompanyOrder, selectedCompanyId)
      : getCustomerInitFilter();

    setFilterData(search);

    // TODO: Guest customer should not be able to see the order list
    if (role === CustomerRole.GUEST) return;

    const initFilter = async () => {
      const createdByUsers =
        isB2BUser && isCompanyOrder ? await getOrdersCreatedByUser(Number(companyId)) : {};

      const orderStatuses = isB2BUser ? await getOrderStatusType() : await getBcOrderStatusType();

      const filterInfo = getFilterMoreData(
        isB2BUser,
        role,
        isCompanyOrder,
        isAgenting,
        createdByUsers,
        orderStatuses,
      );

      setOrderStatuses(orderStatuses);

      const filterInfoWithTranslatedLabel = filterInfo.map((element) => {
        const translatedElement = element;
        translatedElement.label = b3Lang(element.idLang);

        if (element.name === 'orderStatus') {
          translatedElement.options = element.options.map(
            (option: { customLabel: string; systemLabel: string }) => {
              const optionLabel = orderStatusTranslationVariables[option.systemLabel];
              const elementOption = option;
              elementOption.customLabel =
                b3Lang(optionLabel) === elementOption.systemLabel
                  ? elementOption.customLabel
                  : b3Lang(optionLabel);

              return option;
            },
          );
        }

        return element;
      });

      setFilterInfo(filterInfoWithTranslatedLabel);
    };

    initFilter();
  }, [b3Lang, companyId, isAgenting, isB2BUser, isCompanyOrder, role, selectedCompanyId]);

  const fetchList = async ({
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
          orderBy: getOrderBy(orderBy),
        },
        totalCount: allTotal,
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
      render: ({ status }) => (
        <OrderStatus text={getOrderStatusText(status, getOrderStatuses)} code={status} />
      ),
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

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData((data) => ({
        ...data,
        q: value,
      }));
    }
  };

  const handleFilterChange = (value: SearchChangeProps) => {
    let currentStatus = value?.orderStatus || '';
    if (currentStatus) {
      const originStatus = getOrderStatuses.find(
        (status) => status.customLabel === currentStatus || status.systemLabel === currentStatus,
      );

      currentStatus = originStatus?.systemLabel || currentStatus;
    }

    setFilterData((data) => ({
      ...data,
      beginDateAt: value?.startValue || null,
      endDateAt: value?.endValue || null,
      createdBy: value?.PlacedBy || '',
      statusCode: currentStatus,
      companyName: value?.company || '',
    }));
  };

  const columnItems = getColumnItems();

  const handleSelectCompanies = (company: number[]) => {
    const newCompanyIds = company.includes(-1) ? [] : company;

    setFilterData((data) => ({
      ...data,
      companyIds: newCompanyIds,
    }));
  };

  const { data, isFetching } = useQuery({
    queryKey: ['orderList', filterData, pagination, orderBy],
    enabled: Boolean(filterData),
    queryFn: () => fetchList({ ...filterData, ...pagination, orderBy: getOrderBy(orderBy) }),
  });

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
              <B2BAutoCompleteCheckbox handleChangeCompanyIds={handleSelectCompanies} />
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
            filterMoreInfo={filterInfo}
            handleChange={handleChange}
            handleFilterChange={handleFilterChange}
            pcTotalWidth="100%"
            pcContainerWidth="100%"
            pcSearchContainerWidth="100%"
          />
        </Box>

        <B3Table
          columnItems={columnItems}
          listItems={data?.edges || []}
          pagination={{ ...pagination, count: data?.totalCount || 0 }}
          onPaginationChange={setPagination}
          isInfiniteScroll={isMobile}
          renderItem={(row, index) => (
            <OrderItemCard key={row.orderId} goToDetail={() => goToDetail(row, index)} item={row} />
          )}
          onClickRow={goToDetail}
          sortDirection={orderBy.dir}
          sortByFn={handleSetOrderBy}
          orderBy={orderBy.key}
        />
      </Box>
    </B3Spin>
  );
}

export default Order;
