import { Dispatch, ReactElement, SetStateAction, useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, styled, TextField, Typography } from '@mui/material';

import B3Sping from '@/components/spin/B3Sping';
import { B3PaginationTable } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile, useSort } from '@/hooks';
import {
  getBcOrderedProducts,
  getOrderedProducts,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b';
import { activeCurrencyInfoSelector, isB2BUserSelector, useAppSelector } from '@/store';
import {
  currencyFormat,
  displayFormat,
  distanceDay,
  getProductPriceIncTax,
  snackbar,
} from '@/utils';
import { getDisplayPrice } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';

import B3FilterMore from '../../../components/filter/B3FilterMore';
import B3FilterPicker from '../../../components/filter/B3FilterPicker';
import B3FilterSearch from '../../../components/filter/B3FilterSearch';

import QuickOrderCard from './QuickOrderCard';

interface ListItem {
  [key: string]: string;
}

interface ProductInfoProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: string;
  primaryImage: string;
  productId: number;
  productName: string;
  productUrl: string;
  quantity: number | string;
  taxPrice: number;
  updatedAt: number;
  variantId: number;
  variantSku: string;
  productsSearch: CustomFieldItems;
}

interface ListItemProps {
  node: ProductInfoProps;
}

interface SearchProps {
  q: string;
  first?: number;
  offset?: number;
  beginDateAt?: Date | string | number;
  endDateAt?: Date | string | number;
  orderBy: string;
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void;
  getCacheList: () => void;
  setCacheAllList: (items?: ListItemProps[]) => void;
  setList: (items?: ListItemProps[]) => void;
  getSelectedValue: () => void;
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}));

const StyleQuickOrderTable = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',

  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
      },
      '& td: first-of-type': {
        paddingTop: '25px',
      },
    },
  },
}));

interface QuickorderTableProps {
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  setCheckedArr: (values: CustomFieldItems) => void;
  isRequestLoading: boolean;
}

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}));

export const defaultSortKey = 'lastOrderedAt';

export const sortKeys = {
  product: 'productName',
  lastOrderedAt: 'lastOrderedAt',
};

function QuickorderTable({
  setIsRequestLoading,
  setCheckedArr,
  isRequestLoading,
}: QuickorderTableProps) {
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);

  const [search, setSearch] = useState<SearchProps>({
    q: '',
    beginDateAt: distanceDay(90),
    endDateAt: distanceDay(0),
    orderBy: `-${sortKeys[defaultSortKey]}`,
  });

  const [handleSetOrderBy, order, orderBy] = useSort(sortKeys, defaultSortKey, search, setSearch);

  const [total, setTotalCount] = useState<number>(0);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = [];
      listProducts.forEach((item) => {
        const { node } = item;
        node.quantity = 1;
        if (!productIds.includes(node.productId)) {
          productIds.push(node.productId);
        }
      });

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts;

      try {
        const { productsSearch } = await getProducts({
          productIds,
          currencyCode,
          companyId: companyInfoId,
          customerGroupId,
        });

        const newProductsSearch = conversionProductsList(productsSearch);

        listProducts.forEach((item) => {
          const { node } = item;

          const productInfo = newProductsSearch.find((search: CustomFieldItems) => {
            const { id: productId } = search;

            return +node.productId === +productId;
          });

          node.productsSearch = productInfo || {};
        });

        return listProducts;
      } catch (err: any) {
        snackbar.error(err);
      }
    }
    return [];
  };

  const getList = async (params: SearchProps) => {
    const fn = isB2BUser ? getOrderedProducts : getBcOrderedProducts;

    const {
      orderedProducts: { edges, totalCount },
    } = await fn(params);

    const listProducts = await handleGetProductsById(edges);

    setTotalCount(totalCount);

    return {
      edges: listProducts,
      totalCount,
    };
  };

  const handleSearchProduct = async (q: string) => {
    setSearch({
      ...search,
      q,
    });
  };

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getCacheList() || [];
      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const { node } = product;

          return node.id === item;
        });

        return newItems;
      });

      setCheckedArr([...checkedItems]);
    } else {
      setCheckedArr([]);
    }
  };

  const handlePickerChange = (key: string, value: Date | string | number) => {
    const params = {
      ...search,
    };
    if (key === 'start') {
      params.beginDateAt = value || distanceDay(90);
    } else {
      params.endDateAt = value || distanceDay(0);
    }

    setSearch(params);
  };

  const handleFilterChange = (data: any) => {
    const params = {
      ...search,
    };

    params.beginDateAt = data.startValue;

    params.endDateAt = data.endValue;

    setSearch(params);
  };

  const handleUpdateProductQty = (id: number | string, value: number | string) => {
    if (value !== '' && +value <= 0) return;
    const listItems = paginationTableRef.current?.getList() || [];
    const listCacheItems = paginationTableRef.current?.getCacheList() || [];

    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = +value || '';
      }

      return item;
    });
    const newListCacheItems = listCacheItems?.map((item: ListItemProps) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = +value || '';
      }

      return item;
    });
    paginationTableRef.current?.setList([...newListItems]);
    paginationTableRef.current?.setCacheAllList([...newListCacheItems]);
  };

  const showPrice = (price: string, row: CustomFieldItems): string | number => {
    const {
      productsSearch: { isPriceHidden },
    } = row;
    if (isPriceHidden) return '';
    return getDisplayPrice({
      price,
      productInfo: row,
      showText: isPriceHidden ? '' : price,
      forcedSkip: true,
    });
  };

  const handleSetCheckedQty = (row: CustomFieldItems) => {
    const cacheProductList: CustomFieldItems = paginationTableRef.current?.getCacheList() || [];

    let qty = row.quantity;
    if (cacheProductList.length > 0) {
      const currentProduct = cacheProductList.find(
        (item: CustomFieldItems) =>
          item.node.variantId === row.variantId &&
          item.node.productId === row.productId &&
          item.node.id === row.id,
      );

      if (currentProduct && currentProduct.node) {
        qty = currentProduct.node.quantity || qty;
      }
    }

    return qty;
  };

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'product',
      title: b3Lang('purchasedProducts.product'),
      render: (row: CustomFieldItems) => {
        const { optionList } = row;
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.imageUrl || PRODUCT_DEFAULT_IMAGE}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography variant="body1" color="#212121">
                {row.productName}
              </Typography>
              <Typography variant="body1" color="#616161">
                {row.variantSku}
              </Typography>
              {optionList.length > 0 && (
                <Box>
                  {optionList.map((option: any) => (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        color: '#455A64',
                      }}
                      key={option.id}
                    >
                      {`${option.display_name}: ${option.display_value}`}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        );
      },
      width: '40%',
      isSortable: true,
    },
    {
      key: 'price',
      title: b3Lang('purchasedProducts.price'),
      render: (row: CustomFieldItems) => {
        const {
          productsSearch: { variants },
          variantId,
          basePrice,
        } = row;
        let priceIncTax = +basePrice;
        if (variants?.length) {
          priceIncTax = getProductPriceIncTax(variants, +variantId) || +basePrice;
        }

        const qty = handleSetCheckedQty(row);
        const withTaxPrice = priceIncTax || +basePrice;
        const price = withTaxPrice * +qty;

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${showPrice(currencyFormat(price), row)}`}
          </Typography>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'qty',
      title: b3Lang('purchasedProducts.qty'),
      render: (row) => {
        const qty = handleSetCheckedQty(row);

        return (
          <StyledTextField
            size="small"
            type="number"
            variant="filled"
            value={qty}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            onChange={(e) => {
              handleUpdateProductQty(row.id, e.target.value);
            }}
          />
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'lastOrderedAt',
      title: b3Lang('purchasedProducts.lastOrdered'),
      render: (row: CustomFieldItems) => (
        <Box>
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${displayFormat(+row.lastOrderedAt)}`}
          </Typography>
        </Box>
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
      isSortable: true,
    },
  ];

  return (
    <B3Sping isSpinning={isRequestLoading}>
      <StyleQuickOrderTable>
        <Typography
          sx={{
            fontSize: '24px',
            height: '50px',
          }}
        >
          {b3Lang('purchasedProducts.totalProducts', { total })}
        </Typography>
        <Box
          sx={{
            marginBottom: '5px',
            display: 'flex',
            '& label': {
              zIndex: 0,
            },
          }}
        >
          <Box
            sx={{
              width: isMobile ? '100%' : '40%',
              mr: '20px',
              display: 'flex',
              justifyContent: isMobile ? 'space-between' : 'flex-start',
            }}
          >
            <B3FilterSearch
              h="48px"
              searchBGColor="rgba(0, 0, 0, 0.06)"
              handleChange={(e) => {
                handleSearchProduct(e);
              }}
            />

            {isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <B3FilterMore
                  fiterMoreInfo={[]}
                  startPicker={{
                    isEnabled: true,
                    label: b3Lang('purchasedProducts.from'),
                    defaultValue: search?.beginDateAt || '',
                    pickerKey: 'start',
                  }}
                  endPicker={{
                    isEnabled: true,
                    label: b3Lang('purchasedProducts.to'),
                    defaultValue: search?.endDateAt || '',
                    pickerKey: 'end',
                  }}
                  isShowMore
                  onChange={handleFilterChange}
                />
              </Box>
            )}
          </Box>

          {!isMobile && (
            <B3FilterPicker
              handleChange={handlePickerChange}
              xs={{
                mt: 0,
                height: '50px',
              }}
              startPicker={{
                isEnabled: true,
                label: b3Lang('purchasedProducts.from'),
                defaultValue: distanceDay(90),
                pickerKey: 'start',
              }}
              endPicker={{
                isEnabled: true,
                label: b3Lang('purchasedProducts.to'),
                defaultValue: distanceDay(),
                pickerKey: 'end',
              }}
              customWidth="58%"
            />
          )}
        </Box>

        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={columnItems}
          rowsPerPageOptions={[12, 24, 36]}
          getRequestList={getList}
          searchParams={search}
          isCustomRender={false}
          showCheckbox
          showSelectAllCheckbox
          disableCheckbox={false}
          hover
          labelRowsPerPage={b3Lang('purchasedProducts.itemsPerPage')}
          showBorder={false}
          requestLoading={setIsRequestLoading}
          getSelectCheckbox={getSelectCheckbox}
          itemIsMobileSpacing={0}
          isSelectOtherPageCheckbox
          noDataText={b3Lang('purchasedProducts.noProductsFound')}
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          renderItem={(row: ProductInfoProps, _?: number, checkBox?: () => ReactElement) => (
            <QuickOrderCard
              item={row}
              checkBox={checkBox}
              handleUpdateProductQty={handleUpdateProductQty}
            />
          )}
        />
      </StyleQuickOrderTable>
    </B3Sping>
  );
}

export default QuickorderTable;
