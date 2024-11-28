import { ReactElement, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import cloneDeep from 'lodash-es/cloneDeep';

import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { useMobile, useSort } from '@/hooks';
import { GlobalContext } from '@/shared/global';
import { exportInvoicesAsCSV, getInvoiceList, getInvoiceStats } from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { InvoiceList, InvoiceListNode } from '@/types/invoice';
import {
  currencyFormat,
  currencyFormatInfo,
  displayFormat,
  getUTCTimestamp,
  handleGetCorrespondingCurrencyToken,
  snackbar,
} from '@/utils';
import b2bLogger from '@/utils/b3Logger';

import B3Filter from '../../components/filter/B3Filter';

import B3Pulldown from './components/B3Pulldown';
import InvoiceFooter from './components/InvoiceFooter';
import InvoiceStatus from './components/InvoiceStatus';
import PaymentsHistory from './components/PaymentsHistory';
import PaymentSuccess from './components/PaymentSuccess';
import PrintTemplate from './components/PrintTemplate';
import InvoiceListType, {
  defaultSortKey,
  exportOrderByArr,
  filterFormConfig,
  filterFormConfigsTranslationVariables,
  sortIdArr,
} from './utils/config';
import { formattingNumericValues } from './utils/payment';
import { handlePrintPDF } from './utils/pdf';
import { InvoiceItemCard } from './InvoiceItemCard';

export interface FilterSearchProps {
  [key: string]: string | number | null;
  q: string;
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void;
  getCacheList: () => void;
  setCacheAllList: (items?: InvoiceList[]) => void;
  setList: (items?: InvoiceListNode[]) => void;
  getSelectedValue: () => void;
}

const initFilter = {
  q: '',
  first: 10,
  offset: 0,
  orderBy: `-${sortIdArr[defaultSortKey]}`,
};

function Invoice() {
  const currentDate = new Date().getTime();
  const b3Lang = useB3Lang();
  const role = useAppSelector(({ company }) => company.customer.role);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const { invoicePayPermission, purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const navigate = useNavigate();
  const [isMobile] = useMobile();
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

  const { decimal_places: decimalPlaces = 2 } = currencyFormatInfo();

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const [isOpenHistorys, setIsOpenHistorys] = useState<boolean>(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [unpaidAmount, setUnpaidAmount] = useState<number>(0);
  const [overdueAmount, setOverdueAmount] = useState<number>(0);
  const [checkedArr, setCheckedArr] = useState<CustomFieldItems | InvoiceListNode[]>([]);
  const [selectedPay, setSelectedPay] = useState<CustomFieldItems | InvoiceListNode[]>([]);
  const [list, setList] = useState<InvoiceListNode[]>([]);

  const [filterData, setFilterData] = useState<Partial<FilterSearchProps> | null>();

  const [exportCsvText, setExportCsvText] = useState<string>(b3Lang('invoice.exportCsvText'));

  const [filterChangeFlag, setFilterChangeFlag] = useState(false);
  const [filterLists, setFilterLists] = useState<InvoiceListNode[]>([]);

  const {
    state: { bcLanguage },
  } = useContext(GlobalContext);

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortIdArr,
    defaultSortKey,
    filterData,
    setFilterData,
  );

  const location = useLocation();

  const isFiltering = (filterData: Partial<FilterSearchProps>) =>
    Object.keys(filterData).some(
      (key) => key !== 'first' && key !== 'offset' && key !== 'orderBy' && filterData[key],
    );

  const cacheFilterLists = (edges: InvoiceListNode[]) => {
    if (filterChangeFlag) {
      setFilterLists(edges);
      setFilterChangeFlag(false);
      return;
    }

    if (!filterLists.length) setFilterLists(edges);

    const copyCacheFilterList = [...filterLists];

    edges.forEach((item: InvoiceListNode) => {
      const option = item?.node || item;
      const isExist = filterLists.some((cache: InvoiceListNode) => {
        const cacheOption = cache.node;
        return cacheOption.id === option.id;
      });

      if (!isExist) {
        copyCacheFilterList.push(item);
      }
    });

    setFilterLists(copyCacheFilterList);
  };

  const handleStatisticsInvoiceAmount = async () => {
    try {
      setIsRequestLoading(true);
      const { invoiceStats } = await getInvoiceStats(
        filterData?.status ? +filterData.status : 0,
        +decimalPlaces,
      );

      if (invoiceStats) {
        const { overDueBalance, totalBalance } = invoiceStats;
        setUnpaidAmount(+formattingNumericValues(+totalBalance, decimalPlaces));
        setOverdueAmount(+formattingNumericValues(+overDueBalance, decimalPlaces));
      }
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
      });
      setFilterChangeFlag(true);
      setType(InvoiceListType.NORMAL);
    }
  };

  const handleFilterChange = (value: Partial<FilterSearchProps>) => {
    const startValue = value?.startValue
      ? getUTCTimestamp(new Date(value?.startValue).getTime() / 1000)
      : '';

    const endValue = value?.endValue
      ? getUTCTimestamp(new Date(value?.endValue).getTime() / 1000, true)
      : '';

    const status = value?.status === 3 ? 0 : value?.status;

    const search: Partial<FilterSearchProps> = {
      status: `${status}` || '',
      beginDateAt: startValue,
      endDateAt: endValue,
      beginDueDateAt: value?.status === 0 ? parseInt(`${currentDate / 1000}`, 10) : '',
      endDueDateAt: value?.status === 3 ? parseInt(`${currentDate / 1000}`, 10) : '',
    };

    setFilterData({
      ...filterData,
      ...search,
    });
    setFilterChangeFlag(true);
    setType(InvoiceListType.NORMAL);
  };

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getCacheList() || [];

      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: InvoiceListNode) => {
          const { node } = product;

          return +node.id === +item;
        });

        return newItems;
      });

      setCheckedArr([...checkedItems]);
    } else {
      setCheckedArr([]);
    }
  };

  const handleViewInvoice = async (id: string, status: string | number) => {
    try {
      setIsRequestLoading(true);
      const isPayNow = purchasabilityPermission && invoicePayPermission && status !== 2;
      const pdfUrl = await handlePrintPDF(id, isPayNow);

      if (!pdfUrl) {
        snackbar.error(b3Lang('invoice.pdfUrlResolutionError'));
        return;
      }

      const { href } = window.location;
      if (!href.includes('invoice')) {
        return;
      }

      window.open(pdfUrl, '_blank', 'fullscreen=yes');
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleSetSelectedInvoiceAccount = (newPrice: number | string, invoiceId: string) => {
    const currentOriginInvoice = checkedArr.find((invoice: InvoiceListNode) => {
      const {
        node: { id },
      } = invoice;

      return +id === +invoiceId;
    });

    if (selectedPay.length > 0) {
      const newInvoices = selectedPay.map((selectedItem: InvoiceListNode) => {
        const {
          node: { id, openBalance },
        } = selectedItem;
        const {
          node: { openBalance: currentOriginOpenBalance },
        } = currentOriginInvoice;

        if (+id === +invoiceId) {
          openBalance.value =
            +currentOriginOpenBalance.value < +newPrice ? currentOriginOpenBalance.value : newPrice;
        }

        return selectedItem;
      });

      setSelectedPay(newInvoices);
    }
  };

  const handleExportInvoiceAsCSV = async () => {
    try {
      setIsRequestLoading(true);
      const filtering = filterData ? isFiltering(filterData) : false;
      const currentCheckedArr = filtering
        ? filterLists.filter((item: InvoiceListNode) =>
            checkedArr.some((item2: InvoiceListNode) => item?.node?.id === item2?.node?.id),
          )
        : checkedArr;

      const invoiceNumber = currentCheckedArr.map((item: InvoiceListNode) => item.node.id);
      const invoiceStatus = filterData?.status ? [+filterData.status] : [];

      let orderByFiled = '-invoice_number';
      if (filterData?.orderBy) {
        const orderByStr = String(filterData.orderBy);
        orderByFiled = orderByStr.includes('-')
          ? `-${exportOrderByArr[orderByStr.split('-')[1]]}`
          : exportOrderByArr[orderByStr];
      }

      const invoiceFilterData = {
        search: filterData?.q || '',
        idIn: `${invoiceNumber || ''}`,
        orderNumber: '',
        beginDateAt: filterData?.beginDateAt || null,
        endDateAt: filterData?.endDateAt || null,
        status: invoiceStatus,
        orderBy: orderByFiled,
      };

      const { invoicesExport } = await exportInvoicesAsCSV({
        invoiceFilterData,
        lang: bcLanguage || 'en',
      });

      if (invoicesExport?.url) {
        window.open(invoicesExport?.url, '_blank');
      }
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIsRequestLoading(false);
    }
  };

  useEffect(() => {
    if (location?.search) {
      const params = new URLSearchParams(location.search);
      const getInvoiceId = params.get('invoiceId') || '';
      const getReceiptId = params.get('receiptId') || '';

      if (getInvoiceId) {
        setFilterData({
          ...initFilter,
          q: getInvoiceId,
        });
        setType(InvoiceListType.DETAIL);
      }

      if (getReceiptId) {
        // open Successful page
        setType(InvoiceListType.CHECKOUT);
        setFilterData({
          ...initFilter,
        });
        setReceiptId(getReceiptId);
      }
    } else {
      setType(InvoiceListType.NORMAL);
      setFilterData({
        ...initFilter,
      });
    }
  }, [location]);

  useEffect(() => {
    const selectedInvoice =
      checkedArr.filter((item: InvoiceListNode) => {
        const {
          node: { openBalance },
        } = item;

        return +openBalance.value !== 0;
      }) || [];

    if (selectedInvoice.length > 0) {
      if (selectedPay.length === 0) {
        setSelectedPay(cloneDeep(selectedInvoice));
      } else {
        const newArr = selectedInvoice.map((checkedItem: InvoiceListNode) => {
          const {
            node: { id, openBalance },
          } = checkedItem;

          const currentSelectedItem = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item;

            return +id === +selectedId;
          });

          if (currentSelectedItem) {
            const {
              node: { openBalance: currentOpenBalance },
            } = currentSelectedItem;

            openBalance.value = currentOpenBalance.value;
          }

          return checkedItem;
        });

        setSelectedPay(cloneDeep(newArr));
      }
    } else {
      setSelectedPay([]);
    }
    // ignore selectedPay cause it will trigger an useEffect loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedArr]);

  const fetchList = async (params: Partial<FilterSearchProps>) => {
    const {
      invoices: { edges, totalCount },
    } = await getInvoiceList(params);

    const invoicesList: InvoiceListNode[] = edges;

    if (type === InvoiceListType.DETAIL && invoicesList.length) {
      invoicesList.forEach((invoice: InvoiceListNode) => {
        const item = invoice;
        item.node.isCollapse = true;
      });
    }

    invoicesList.forEach((invoiceNode: InvoiceListNode) => {
      const {
        node: { openBalance },
      } = invoiceNode;
      const item = invoiceNode;
      item.node.disableCurrentCheckbox = false;

      openBalance.originValue = `${+openBalance.value}`;
      openBalance.value = formattingNumericValues(+openBalance.value, decimalPlaces);
    });
    setList(invoicesList);
    handleStatisticsInvoiceAmount();

    if (filterData && isFiltering(filterData) && invoicesList.length) {
      cacheFilterLists(invoicesList);
    } else {
      setFilterLists([]);
    }

    return {
      edges: invoicesList,
      totalCount,
    };
  };

  const handleSetSelectedInvoiceAccountNumber = (val: string, id: string) => {
    let result = val;
    if (val.includes('.')) {
      const wholeDecimalNumber = val.split('.');
      const movePoint = decimalPlaces === 0 ? 0 : wholeDecimalNumber[1].length - +decimalPlaces;
      if (wholeDecimalNumber[1] && movePoint > 0) {
        const newVal = wholeDecimalNumber[0] + wholeDecimalNumber[1];
        result = `${newVal.slice(0, -decimalPlaces)}.${newVal.slice(-decimalPlaces)}`;
      }
      if (wholeDecimalNumber[1] && movePoint === 0) {
        result = formattingNumericValues(+val, decimalPlaces);
      }
    } else if (result.length > 1) {
      result = `${val.slice(0, 1)}.${val.slice(-1)}`;
      if (+decimalPlaces === 0) result = `${val}`;
    } else {
      result = `${val}`;
    }

    handleSetSelectedInvoiceAccount(result, id);
  };

  const columnAllItems: TableColumnItem<InvoiceList>[] = [
    {
      key: 'id',
      title: b3Lang('invoice.headers.invoice'),
      isSortable: true,
      render: (item: InvoiceList) => (
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            ':hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => {
            handleViewInvoice(item.id, item.status);
          }}
        >
          {item?.invoiceNumber ? item?.invoiceNumber : item?.id}
        </Box>
      ),
      width: '8%',
    },
    {
      key: 'orderNumber',
      title: b3Lang('invoice.headers.order'),
      isSortable: true,
      render: (item: InvoiceList) => (
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            ':hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => {
            navigate(`/orderDetail/${item.orderNumber}`);
          }}
        >
          {item?.orderNumber || '-'}
        </Box>
      ),
      width: '8%',
    },
    {
      key: 'createdAt',
      title: b3Lang('invoice.headers.invoiceDate'),
      isSortable: true,
      render: (item: InvoiceList) => `${item.createdAt ? displayFormat(+item.createdAt) : '–'}`,
      width: '10%',
    },
    {
      key: 'updatedAt',
      title: b3Lang('invoice.headers.dueDate'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { dueDate, status } = item;
        const isOverdue = currentDate > dueDate * 1000 && status !== 2;

        return (
          <Typography
            sx={{
              color: isOverdue ? '#D32F2F' : 'rgba(0, 0, 0, 0.87)',
              fontSize: '14px',
            }}
          >
            {`${item.dueDate ? displayFormat(+item.dueDate) : '–'}`}
          </Typography>
        );
      },
      width: '10%',
    },
    {
      key: 'originalBalance',
      title: b3Lang('invoice.headers.invoiceTotal'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { originalBalance } = item;
        const originalAmount = formattingNumericValues(+originalBalance.value, decimalPlaces);

        const token = handleGetCorrespondingCurrencyToken(originalBalance.code);

        return `${token}${originalAmount || 0}`;
      },
      width: '10%',
    },
    {
      key: 'openBalance',
      title: b3Lang('invoice.headers.amountDue'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { openBalance } = item;

        const openAmount = formattingNumericValues(+openBalance.value, decimalPlaces);
        const token = handleGetCorrespondingCurrencyToken(openBalance.code);

        return `${token}${openAmount || 0}`;
      },
      width: '10%',
    },
    {
      key: 'openBalanceToPay',
      title: b3Lang('invoice.headers.amountToPay'),
      render: (item: InvoiceList) => {
        const { openBalance, id } = item;
        const currentCode = openBalance.code || 'USD';
        let valuePrice = openBalance.value;
        let disabled = true;

        if (selectedPay.length > 0) {
          const currentSelected = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item;

            return +selectedId === +id;
          });

          if (currentSelected) {
            const {
              node: { openBalance: selectedOpenBalance },
            } = currentSelected;

            disabled = false;
            valuePrice = selectedOpenBalance.value;

            if (+openBalance.value === 0) {
              disabled = true;
            }
          }
        }

        return (
          <TextField
            disabled={disabled}
            variant="filled"
            value={valuePrice || ''}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={{ padding: '8px 0', marginTop: '0 !important' }}
                >
                  {handleGetCorrespondingCurrencyToken(currentCode)}
                </InputAdornment>
              ),
            }}
            sx={{
              '& input': {
                paddingTop: '8px',
              },
              '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button':
                {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
            }}
            onChange={(e: CustomFieldItems) => {
              const val = e.target?.value;
              handleSetSelectedInvoiceAccountNumber(val, id);
            }}
            type="number"
          />
        );
      },
      width: '15%',
    },
    {
      key: 'status',
      title: b3Lang('invoice.headers.status'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { status, dueDate } = item;
        let code = item.status;

        // (3, "Overdue")-【Display status when invoice exceeds due date. For front-end display only】
        if (status === 0 && currentDate > dueDate * 1000) {
          code = 3;
        }

        return <InvoiceStatus code={code} />;
      },
    },
    {
      key: 'companyName',
      title: b3Lang('invoice.headers.action'),
      render: (row: InvoiceList) => {
        const { id } = row;
        let actionRow = row;
        if (selectedPay.length > 0) {
          const currentSelected = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item;

            return +selectedId === +id;
          });

          if (currentSelected) {
            actionRow = currentSelected.node;
          }
        }

        return (
          <B3Pulldown
            row={actionRow}
            setInvoiceId={setCurrentInvoiceId}
            handleOpenHistoryModal={setIsOpenHistorys}
            setIsRequestLoading={setIsRequestLoading}
          />
        );
      },
      width: '10%',
    },
  ];

  useEffect(() => {
    let exportCsvTexts = b3Lang('invoice.exportCsvText');

    const filtering = filterData ? isFiltering(filterData) : false;
    const currentCheckedArr = filtering
      ? filterLists.filter((item: InvoiceListNode) =>
          checkedArr.some((item2: InvoiceListNode) => item?.node?.id === item2?.node?.id),
        )
      : checkedArr;

    if (filtering) {
      exportCsvTexts =
        currentCheckedArr.length > 0
          ? b3Lang('invoice.exportSelectedAsCsv')
          : b3Lang('invoice.exportFilteredAsCsv');
    } else {
      exportCsvTexts =
        currentCheckedArr.length > 0
          ? b3Lang('invoice.exportSelectedAsCsv')
          : b3Lang('invoice.exportCsvText');
    }

    setExportCsvText(exportCsvTexts);
    // disabling because of b3lang rendering errors
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedArr, filterData, filterLists]);

  const translatedFilterFormConfigs = filterFormConfig.map((element) => {
    const config = element;
    if (element.name === 'status') {
      config.label = b3Lang(filterFormConfigsTranslationVariables.status);
    }

    config.options = element.options.map((option) => {
      const elementOption = option;
      elementOption.label = b3Lang(filterFormConfigsTranslationVariables[option.key]);

      return option;
    });

    return element;
  });

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <B3Filter
            fiterMoreInfo={translatedFilterFormConfigs}
            handleChange={handleChange}
            handleFilterChange={handleFilterChange}
            startPicker={{
              isEnabled: true,
              label: b3Lang('invoice.filter.from'),
              defaultValue:
                typeof filterData?.beginDateAt === 'number' ? +filterData.beginDateAt * 1000 : '',
              pickerKey: 'start',
            }}
            endPicker={{
              isEnabled: true,
              label: b3Lang('invoice.filter.to'),
              defaultValue:
                typeof filterData?.endDateAt === 'number' ? +filterData.endDateAt * 1000 : '',
              pickerKey: 'end',
            }}
            searchValue={filterData?.q || ''}
          />
          <Box
            sx={{
              display: 'flex',
              marginBottom: '30px',
              flexDirection: document.body.clientWidth <= 465 ? 'column' : 'row',
            }}
          >
            <Typography
              sx={{
                fontSize: '24px',
                color: '#000000',
              }}
            >
              {b3Lang('invoice.openUnpaid', {
                unpaid: currencyFormat(unpaidAmount),
              })}
            </Typography>
            {document.body.clientWidth >= 465 && (
              <Typography
                sx={{
                  fontSize: '24px',
                  margin: '0 8px',
                }}
              >
                |
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: '24px',
                color: '#D32F2F',
              }}
            >
              {b3Lang('invoice.overdueAmount', {
                overdue: currencyFormat(overdueAmount),
              })}
            </Typography>
          </Box>
        </Box>
        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={columnAllItems}
          rowsPerPageOptions={[10, 20, 30]}
          getRequestList={fetchList}
          searchParams={filterData}
          isCustomRender={false}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          showCheckbox={invoicePayPermission && purchasabilityPermission}
          showSelectAllCheckbox={!isMobile && invoicePayPermission && purchasabilityPermission}
          disableCheckbox={false}
          applyAllDisableCheckbox={false}
          getSelectCheckbox={getSelectCheckbox}
          CollapseComponent={PrintTemplate}
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          isSelectOtherPageCheckbox
          hover
          renderItem={(
            row: InvoiceList,
            index?: number,
            checkBox?: (disable?: boolean) => ReactElement,
          ) => (
            <InvoiceItemCard
              item={row}
              checkBox={checkBox}
              handleSetSelectedInvoiceAccount={handleSetSelectedInvoiceAccountNumber}
              handleViewInvoice={handleViewInvoice}
              setIsRequestLoading={setIsRequestLoading}
              setInvoiceId={setCurrentInvoiceId}
              handleOpenHistoryModal={setIsOpenHistorys}
              selectedPay={selectedPay}
              handleGetCorrespondingCurrency={handleGetCorrespondingCurrencyToken}
              addBottom={list.length - 1 === index}
            />
          )}
        />
        {list.length > 0 && !isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '8px',
              left: '20px',
            }}
          >
            <Button variant="text" onClick={handleExportInvoiceAsCSV}>
              {exportCsvText}
            </Button>
          </Box>
        )}
      </Box>
      {selectedPay.length > 0 && (role === 0 || isAgenting) && (
        <InvoiceFooter selectedPay={selectedPay} decimalPlaces={decimalPlaces} />
      )}
      <PaymentsHistory
        open={isOpenHistorys}
        currentInvoiceId={currentInvoiceId}
        setOpen={setIsOpenHistorys}
      />
      <PaymentSuccess receiptId={+receiptId} type={type} />
    </B3Spin>
  );
}

export default Invoice;
