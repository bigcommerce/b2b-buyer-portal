import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { useMobile } from '@/hooks/useMobile';
import { useSort } from '@/hooks/useSort';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  getB2BQuotesList,
  getBCQuotesList,
  getShoppingListsCreatedByUser,
} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { currencyFormatConvert } from '@/utils/b3CurrencyFormat';
import { displayFormat } from '@/utils/b3DateFormat';
import { channelId } from '@/utils/basicConfig';

import QuoteStatus from '../quote/components/QuoteStatus';
import { addPrice } from '../quote/shared/config';

import { QuoteItemCard } from './QuoteItemCard';

interface ListItem {
  [key: string]: string | Object;
  status: string;
  quoteNumber: string;
}

interface FilterSearchProps {
  first: number;
  offset: number;
  q: string;
  orderBy: string;
  createdBy: string;
  status: string | number;
  salesRep: string;
  dateCreatedBeginAt: string;
  dateCreatedEndAt: string;
  startValue: string;
  endValue: string;
}

const quotesStatuses = [
  {
    idLangCustomLabel: 'quotes.open',
    statusCode: 1,
  },
  {
    idLangCustomLabel: 'quotes.ordered',
    statusCode: 4,
  },
  {
    idLangCustomLabel: 'quotes.expired',
    statusCode: 5,
  },
];

const defaultSortKey = 'quoteNumber';

const sortKeys = {
  quoteNumber: 'quoteNumber',
  quoteTitle: 'quoteTitle',
  salesRep: 'salesRep',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  expiredAt: 'expiredAt',
  status: 'status',
};

function useData() {
  const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id);
  const customer = useAppSelector(({ company }) => company.customer);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const draftQuoteListLength = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteList.length);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const b3Lang = useB3Lang();

  const companyId = companyB2BId || salesRepCompanyId;

  const getQuotesList = (
    params: Partial<FilterSearchProps>,
  ): ReturnType<typeof getB2BQuotesList | typeof getBCQuotesList> => {
    return isB2BUser
      ? getB2BQuotesList({ ...params, channelId })
      : getBCQuotesList({ ...params, channelId });
  };

  const getFilters = () => [
    {
      name: 'status',
      label: b3Lang('quotes.quoteStatus'),
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: quotesStatuses.map(({ idLangCustomLabel, ...restQuoteStatuses }) => ({
        customLabel: b3Lang(idLangCustomLabel),
        ...restQuoteStatuses,
      })),
      replaceOptions: {
        label: 'customLabel',
        value: 'statusCode',
      },
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ];

  const getB2BFilters = async () => {
    const createdByUsers = await getShoppingListsCreatedByUser(Number(companyId), 2);

    const newCreatedByUsers =
      createdByUsers?.createdByUser?.results?.createdBy.map((item: any) => ({
        createdBy: item.email ? `${item.name} (${item.email})` : `${item.name}`,
      })) || [];

    const newCreatedBySalesReps =
      createdByUsers?.createdByUser?.results?.salesRep.map((item: any) => ({
        salesRep: `${item.salesRep || item.salesRepEmail}`,
      })) || [];

    return [
      ...getFilters(),
      {
        name: 'createdBy',
        label: b3Lang('quotes.createdBy'),
        required: false,
        default: '',
        fieldType: 'dropdown',
        options: newCreatedByUsers,
        replaceOptions: {
          label: 'createdBy',
          value: 'createdBy',
        },
        xs: 12,
        variant: 'filled',
        size: 'small',
      },
      {
        name: 'salesRep',
        label: b3Lang('quotes.salesRep'),
        required: false,
        default: '',
        fieldType: 'dropdown',
        options: newCreatedBySalesReps,
        replaceOptions: {
          label: 'salesRep',
          value: 'salesRep',
        },
        xs: 12,
        variant: 'filled',
        size: 'small',
      },
    ];
  };

  const getAvailableFilters = async () => {
    if (isB2BUser) {
      return getB2BFilters();
    }

    return getFilters();
  };

  return {
    companyId,
    isB2BUser,
    draftQuoteListLength,
    customer,
    getQuotesList,
    getAvailableFilters,
  };
}

const useColumnList = (): Array<TableColumnItem<ListItem>> => {
  const b3Lang = useB3Lang();

  return useMemo(
    () => [
      {
        key: 'quoteNumber',
        title: b3Lang('quotes.quoteNumber'),
        isSortable: true,
      },
      {
        key: 'quoteTitle',
        title: b3Lang('quotes.title'),
        isSortable: true,
      },
      {
        key: 'salesRep',
        title: b3Lang('quotes.salesRep'),
        render: (item: ListItem) => `${item.salesRep || item.salesRepEmail}`,
        isSortable: true,
      },
      {
        key: 'createdBy',
        title: b3Lang('quotes.createdBy'),
        isSortable: true,
      },
      {
        key: 'createdAt',
        title: b3Lang('quotes.dateCreated'),
        render: (item: ListItem) =>
          `${Number(item.status) !== 0 ? displayFormat(Number(item.createdAt)) : item.createdAt}`,
        isSortable: true,
      },
      {
        key: 'updatedAt',
        title: b3Lang('quotes.lastUpdate'),
        render: (item: ListItem) =>
          `${Number(item.status) !== 0 ? displayFormat(Number(item.updatedAt)) : item.updatedAt}`,
        isSortable: true,
      },
      {
        key: 'expiredAt',
        title: b3Lang('quotes.expirationDate'),
        render: (item: ListItem) =>
          `${Number(item.status) !== 0 ? displayFormat(Number(item.expiredAt)) : item.expiredAt}`,
        isSortable: true,
      },
      {
        key: 'totalAmount',
        title: b3Lang('quotes.subtotal'),
        render: (item: ListItem) => {
          const { totalAmount, currency } = item;
          const newCurrency = currency as CurrencyProps;
          return currencyFormatConvert(Number(totalAmount), {
            currency: newCurrency,
            isConversionRate: false,
            useCurrentCurrency: !!currency,
          });
        },
        style: {
          textAlign: 'right',
        },
      },
      {
        key: 'status',
        title: b3Lang('quotes.status'),
        render: (item: ListItem) => <QuoteStatus code={item.status} />,
        isSortable: true,
      },
    ],
    [b3Lang],
  );
};

function QuotesList() {
  const { getAvailableFilters, draftQuoteListLength, customer, getQuotesList } = useData();
  const columns = useColumnList();

  const initSearch = {
    q: '',
    orderBy: `-${sortKeys[defaultSortKey]}`,
    createdBy: '',
    salesRep: '',
    status: '',
    dateCreatedBeginAt: '',
    dateCreatedEndAt: '',
  };

  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>(initSearch);

  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const [filterMoreInfo, setFilterMoreInfo] = useState<Array<any>>([]);

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortKeys,
    defaultSortKey,
    filterData,
    setFilterData,
  );

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const {
    state: { openAPPParams },
    dispatch,
  } = useContext(GlobalContext);

  useEffect(() => {
    getAvailableFilters().then((filters) => setFilterMoreInfo(filters));

    if (openAPPParams.quoteBtn) {
      dispatch({
        type: 'common',
        payload: {
          openAPPParams: {
            quoteBtn: '',
            shoppingListBtn: '',
          },
        },
      });
    }
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToDetail = (item: ListItem, status: number) => {
    if (Number(status) === 0) {
      navigate('/quoteDraft');
    } else {
      const uuidParam = item.uuid ? `&uuid=${item.uuid}` : '';
      navigate(`/quoteDetail/${item.id}?date=${item.createdAt}${uuidParam}`);
    }
  };

  const fetchList: GetRequestList<Partial<FilterSearchProps>, ListItem> = useCallback(
    async (params) => {
      const { edges = [], totalCount } = await getQuotesList(params);

      if (params.offset === 0 && draftQuoteListLength) {
        const summaryPrice = addPrice();

        const quoteDraft = {
          node: {
            quoteNumber: '—',
            quoteTitle: '—',
            createdAt: '—',
            salesRepEmail: '—',
            createdBy: `${customer.firstName} ${customer.lastName}`,
            updatedAt: '—',
            expiredAt: '—',
            totalAmount: summaryPrice?.grandTotal,
            status: 0,
            taxTotal: summaryPrice?.tax,
          },
        };

        const { status, createdBy, salesRep, dateCreatedBeginAt, dateCreatedEndAt } = filterData;

        const showDraft = !status && !salesRep && !dateCreatedBeginAt && !dateCreatedEndAt;

        if (createdBy && showDraft) {
          const getCreatedByReg = /^[^(]+/;
          const createdByUserRegArr = getCreatedByReg.exec(createdBy);
          const createdByUser = createdByUserRegArr?.length ? createdByUserRegArr[0].trim() : '';
          if (createdByUser === quoteDraft.node.createdBy) edges.unshift(quoteDraft);
        } else if (showDraft) {
          edges.unshift(quoteDraft);
        }
      }

      return {
        edges,
        totalCount,
      };
    },
    [getQuotesList, draftQuoteListLength, customer.firstName, customer.lastName, filterData],
  );

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
      });
    }
  };

  const handleFilterChange = (value: Partial<FilterSearchProps>) => {
    const search: Partial<FilterSearchProps> = {
      createdBy: value?.createdBy || '',
      status: value?.status || '',
      salesRep: value?.salesRep || '',
      dateCreatedBeginAt: value?.startValue || '',
      dateCreatedEndAt: value?.endValue || '',
    };

    setFilterData({
      ...filterData,
      ...search,
    });
  };

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <B3Filter
          filterMoreInfo={filterMoreInfo}
          startPicker={{
            isEnabled: true,
            label: b3Lang('quotes.from'),
            defaultValue: filterData?.dateCreatedBeginAt || '',
            pickerKey: 'start',
          }}
          endPicker={{
            isEnabled: true,
            label: b3Lang('quotes.to'),
            defaultValue: filterData?.dateCreatedEndAt || '',
            pickerKey: 'end',
          }}
          handleChange={handleChange}
          handleFilterChange={handleFilterChange}
        />
        <B3PaginationTable
          tableFixed
          columnItems={columns}
          rowsPerPageOptions={[10, 20, 30]}
          getRequestList={fetchList}
          searchParams={filterData}
          isCustomRender={false}
          requestLoading={setIsRequestLoading}
          tableKey="quoteNumber"
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          labelRowsPerPage={
            isMobile ? b3Lang('quotes.cardsPerPage') : b3Lang('quotes.quotesPerPage')
          }
          renderItem={(row) => <QuoteItemCard item={row} goToDetail={goToDetail} />}
          onClickRow={(row) => {
            goToDetail(row, Number(row.status));
          }}
          hover
        />
      </Box>
    </B3Spin>
  );
}

export default QuotesList;
