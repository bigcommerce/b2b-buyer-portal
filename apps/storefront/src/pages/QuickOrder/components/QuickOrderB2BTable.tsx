import { Dispatch, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { Box, FormControlLabel, styled, Switch, TextField, Typography } from '@mui/material';

import BackorderMessage from '@/components/BackorderMessage';
import PicklistBackorderMessages from '@/components/PicklistBackorderMessages';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useBackorderStorefrontMessaging } from '@/hooks/useBackorderStorefrontMessaging';
import { useMobile } from '@/hooks/useMobile';
import { useSort } from '@/hooks/useSort';
import { useB3Lang } from '@/lib/lang';
import { getOrderedProducts, searchProducts } from '@/shared/service/b2b';
import {
  type CatalogQuickVariantSku,
  getVariantInfoBySkus,
  type ProductSearch,
} from '@/shared/service/b2b/graphql/product';
import { activeCurrencyInfoSelector, useAppSelector } from '@/store';
import { ProductInfoType } from '@/types/gql/graphql';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import { displayFormat } from '@/utils/b3DateFormat';
import { distanceDay } from '@/utils/b3Picker';
import { getProductPriceIncTaxOrExTaxBySetting } from '@/utils/b3Price';
import { getDisplayPrice } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import { snackbar } from '@/utils/b3Tip';
import {
  catalogListHasBackorderedItemsForDisplay,
  catalogListHasPicklistBackorderedItemsForDisplay,
  getCatalogProductRowDisplayState,
  getProductDetailsForPicklistSelections,
} from '@/utils/catalogBackorderDisplay';

import B3FilterMore from '../../../components/filter/B3FilterMore';
import B3FilterPicker from '../../../components/filter/B3FilterPicker';
import B3FilterSearch from '../../../components/filter/B3FilterSearch';
import { CheckedProduct } from '../utils';

import QuickOrderCard from './QuickOrderCard';

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
  productsSearch: ProductInfoType;
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

interface QuickOrderTableProps {
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  setCheckedArr: (values: CheckedProduct[]) => void;
  isRequestLoading: boolean;
}

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}));

const defaultSortKey = 'lastOrderedAt';

const sortKeys = {
  product: 'productName',
  lastOrderedAt: 'lastOrderedAt',
};

function QuickOrderTable({
  setIsRequestLoading,
  setCheckedArr,
  isRequestLoading,
}: QuickOrderTableProps) {
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

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
  const [variantInfoList, setVariantInfoList] = useState<CatalogQuickVariantSku[]>([]);
  const [picklistProductsById, setPicklistProductsById] = useState<Record<number, ProductSearch>>(
    {},
  );
  const [showBackorderDetails, setShowBackorderDetails] = useState(false);
  const [tableDataVersion, setTableDataVersion] = useState(0);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const {
    isBackorderMessagingContextEnabled,
    isBackorderMessagingEnabled,
    hasAnyBackorderDisplay,
  } = useBackorderStorefrontMessaging();
  const backorderUiEnabled = isBackorderMessagingContextEnabled && hasAnyBackorderDisplay;

  const inventoryBySku = useMemo(() => {
    const map: Record<string, CatalogQuickVariantSku> = {};
    variantInfoList.forEach((row) => {
      if (row.variantSku) {
        map[row.variantSku.toUpperCase()] = row;
      }
    });
    return map;
  }, [variantInfoList]);

  const fetchInventoryForSkus = useCallback(
    async (skus: string[]) => {
      if (!backorderUiEnabled || skus.length === 0) return;

      const existingSkus = new Set(
        variantInfoList.flatMap((row) => (row.variantSku ? [row.variantSku.toUpperCase()] : [])),
      );

      const newSkus = [...new Set(skus.map((sku) => sku.toUpperCase()))].filter(
        (sku) => !existingSkus.has(sku),
      );

      if (newSkus.length === 0) return;

      try {
        const { variantSku: nextVariantInfoList = [] } = await getVariantInfoBySkus(newSkus);
        setVariantInfoList((prev) => [...prev, ...nextVariantInfoList]);
      } catch {
        // Inventory fetch failure should not block the product list
      }
    },
    [backorderUiEnabled, variantInfoList],
  );

  const hasBackorderedItems = useMemo(() => {
    if (!isBackorderMessagingEnabled) {
      return false;
    }

    const cacheList: ListItemProps[] = paginationTableRef.current?.getCacheList() || [];
    const items = cacheList.map(({ node }) => ({
      qty: Number(node.quantity) || 0,
      variantSku: node.variantSku,
    }));

    if (catalogListHasBackorderedItemsForDisplay(items, inventoryBySku)) {
      return true;
    }

    const picklistRows = cacheList.map(({ node }) => ({
      qty: Number(node.quantity) || 0,
      selections: getProductDetailsForPicklistSelections(node),
    }));

    return catalogListHasPicklistBackorderedItemsForDisplay(picklistRows, picklistProductsById);
    // tableDataVersion drives re-evaluation when list or qty changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryBySku, picklistProductsById, isBackorderMessagingEnabled, tableDataVersion]);

  const showBackorderToggle = backorderUiEnabled && hasBackorderedItems;

  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);

  const fetchPicklistProducts = useCallback(
    async (productIds: number[]) => {
      if (!backorderUiEnabled || productIds.length === 0) {
        return;
      }

      const newProductIds = [...new Set(productIds)].filter((id) => !picklistProductsById[id]);

      if (newProductIds.length === 0) {
        return;
      }

      try {
        const { productsSearch = [] } = await searchProducts({
          productIds: newProductIds,
          currencyCode,
          companyId: companyInfoId,
          customerGroupId,
        });

        setPicklistProductsById((prev) => {
          const next = { ...prev };
          productsSearch.forEach((product: ProductSearch) => {
            next[Number(product.id)] = product;
          });
          return next;
        });
      } catch {
        // Inventory fetch failure should not block the product list
      }
    },
    [backorderUiEnabled, picklistProductsById, currencyCode, companyInfoId, customerGroupId],
  );

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

      try {
        const { productsSearch } = await searchProducts({
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

            return Number(node.productId) === Number(productId);
          });

          node.productsSearch = productInfo || {};
        });

        return listProducts;
      } catch (error: unknown) {
        if (error instanceof Error) {
          snackbar.error(error.message);
        }
      }
    }
    return [];
  };

  const getList: GetRequestList<SearchProps, ProductInfoProps> = async (params) => {
    const {
      orderedProducts: { edges, totalCount },
    } = await getOrderedProducts(params);

    const listProducts = await handleGetProductsById(edges);

    setTotalCount(totalCount);

    if (backorderUiEnabled && listProducts?.length) {
      const skus = listProducts
        .map((item) => item.node.variantSku)
        .filter((sku): sku is string => Boolean(sku));
      fetchInventoryForSkus(skus).catch(() => {
        // Inventory fetch failure should not block the product list
      });

      const picklistProductIds = listProducts.flatMap((item) =>
        getProductDetailsForPicklistSelections(item.node).map((selection) => selection.productId),
      );
      fetchPicklistProducts(picklistProductIds).catch(() => {
        // Inventory fetch failure should not block the product list
      });
    }

    setTableDataVersion((version) => version + 1);

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
      const checkedItems = selectCheckbox.reduce((pre, item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const { node } = product;

          return node.id === item;
        });

        if (newItems) pre.push(newItems);

        return pre;
      }, []);

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
    if (value !== '' && Number(value) <= 0) return;
    const listItems = paginationTableRef.current?.getList() || [];
    const listCacheItems = paginationTableRef.current?.getCacheList() || [];

    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = Number(value) || '';
      }

      return item;
    });
    const newListCacheItems = listCacheItems?.map((item: ListItemProps) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = Number(value) || '';
      }

      return item;
    });
    paginationTableRef.current?.setList([...newListItems]);
    paginationTableRef.current?.setCacheAllList([...newListCacheItems]);
    setTableDataVersion((version) => version + 1);
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

  const columnItems: TableColumnItem<ProductInfoProps>[] = [
    {
      key: 'product',
      title: b3Lang('purchasedProducts.product'),
      render: (row: CustomFieldItems) => {
        const { optionList, productsSearch, variantId } = row;
        const currentVariants = productsSearch.variants || [];

        const currentImage =
          b2bGetVariantImageByVariantInfo(currentVariants, { variantId }) || row.imageUrl;
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={currentImage || PRODUCT_DEFAULT_IMAGE}
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
        let priceIncTax = Number(basePrice);
        if (variants?.length) {
          priceIncTax =
            getProductPriceIncTaxOrExTaxBySetting(variants, Number(variantId)) || Number(basePrice);
        }

        const qty = handleSetCheckedQty(row);
        const withTaxPrice = priceIncTax || Number(basePrice);
        const price = withTaxPrice * Number(qty);

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
        const inventoryRow = inventoryBySku[row.variantSku?.toUpperCase()];
        const { backorderFields } = getCatalogProductRowDisplayState({
          qty: Number(qty) || 0,
          showAvailableToSellHelper: false,
          inventoryRow,
          backorderUiEnabled,
          formatOnlyAvailable: () => '',
        });
        const picklistSelections = getProductDetailsForPicklistSelections(row);

        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
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
            {backorderFields && (
              <Box sx={{ mt: 1, width: '100%', textAlign: 'right' }}>
                <BackorderMessage
                  totalOnHand={backorderFields.totalOnHand}
                  quantityBackordered={backorderFields.quantityBackordered}
                  backorderMessage={backorderFields.backorderMessage}
                  visible={showBackorderDetails}
                />
              </Box>
            )}
            {picklistSelections.length > 0 && (
              <Box sx={{ width: '100%', textAlign: 'right' }}>
                <PicklistBackorderMessages
                  selections={picklistSelections}
                  picklistProductsById={picklistProductsById}
                  qty={Number(qty) || 0}
                  visible={showBackorderDetails}
                  backorderUiEnabled={backorderUiEnabled}
                />
              </Box>
            )}
          </Box>
        );
      },
      width: backorderUiEnabled ? '18%' : '15%',
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
            {`${displayFormat(Number(row.lastOrderedAt))}`}
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
    <B3Spin isSpinning={isRequestLoading}>
      <StyleQuickOrderTable>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '50px',
            marginBottom: '0.5rem',
          }}
        >
          <Typography
            sx={{
              fontSize: '24px',
            }}
          >
            {b3Lang('purchasedProducts.totalProducts', { total })}
          </Typography>
          {showBackorderToggle && (
            <FormControlLabel
              control={
                <Switch
                  checked={showBackorderDetails}
                  onChange={(e) => setShowBackorderDetails(e.target.checked)}
                />
              }
              label={b3Lang('quoteDetail.table.backorderDetails')}
              labelPlacement="start"
              sx={{ mr: 0, gap: '0.5rem', flexShrink: 0 }}
            />
          )}
        </Box>
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
                  filterMoreInfo={[]}
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
          renderItem={(row, _, checkBox) => (
            <QuickOrderCard
              item={row}
              checkBox={checkBox}
              handleUpdateProductQty={handleUpdateProductQty}
              inventoryBySku={inventoryBySku}
              picklistProductsById={picklistProductsById}
              backorderUiEnabled={backorderUiEnabled}
              showBackorderDetails={showBackorderDetails}
            />
          )}
        />
      </StyleQuickOrderTable>
    </B3Spin>
  );
}

export default QuickOrderTable;
