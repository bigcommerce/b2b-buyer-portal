import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box, Grid, useTheme } from '@mui/material';

import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks';
import { GlobaledContext } from '@/shared/global';
import {
  deleteB2BShoppingListItem,
  deleteBcShoppingListItem,
  getB2BJuniorPlaceOrder,
  getB2BShoppingListDetails,
  getBcShoppingListDetails,
  searchB2BProducts,
  searchBcProducts,
  updateB2BShoppingList,
  updateBcShoppingList,
} from '@/shared/service/b2b';
import { activeCurrencyInfoSelector, isB2BUserSelector, useAppSelector } from '@/store';
import { channelId, snackbar } from '@/utils';
import { calculateProductListPrice, getBCPrice } from '@/utils/b3Product/b3Product';
import {
  conversionProductsList,
  CustomerInfoProps,
  ListItemProps,
  ProductsProps,
  SearchProps,
  ShoppingListInfoProps,
} from '@/utils/b3Product/shared/config';

import AddToShoppingList from './components/AddToShoppingList';
import ReAddToCart from './components/ReAddToCart';
import ShoppingDetailDeleteItems from './components/ShoppingDetailDeleteItems';
import ShoppingDetailFooter from './components/ShoppingDetailFooter';
import ShoppingDetailHeader from './components/ShoppingDetailHeader';
import ShoppingDetailTable from './components/ShoppingDetailTable';
import {
  ShoppingListDetailsContext,
  ShoppingListDetailsProvider,
} from './context/ShoppingListDetailsContext';

interface TableRefProps extends HTMLInputElement {
  initSearch: () => void;
}

interface OpenPageState {
  isOpen: boolean;
  openUrl?: string;
}

interface UpdateShoppingListParamsProps {
  id: number;
  name: string;
  description: string;
  status?: number;
  channelId?: number;
}

interface ShoppingListDetailsProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>;
}
interface ShoppingListDetailsContentProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>;
}

// shoppingList status: 0 -- Approved; 20 -- Rejected; 30 -- Draft; 40 -- Ready for approval
// 0: Admin, 1: Senior buyer, 2: Junior buyer, 3: Super admin

function ShoppingListDetails({ setOpenPage }: ShoppingListDetailsProps) {
  const { id = '' } = useParams();
  const {
    state: { openAPPParams, productQuoteEnabled = false },
  } = useContext(GlobaledContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const navigate = useNavigate();
  const [isMobile] = useMobile();
  const { dispatch } = useContext(ShoppingListDetailsContext);

  const theme = useTheme();

  const b3Lang = useB3Lang();

  const primaryColor = theme.palette.primary.main;

  const tableRef = useRef<TableRefProps | null>(null);

  const [checkedArr, setCheckedArr] = useState<CustomFieldItems>([]);
  const [shoppingListInfo, setShoppingListInfo] = useState<null | ShoppingListInfoProps>(null);
  const [customerInfo, setCustomerInfo] = useState<null | CustomerInfoProps>(null);
  const [selectedSubTotal, setSelectedSubTotal] = useState<number>(0.0);
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<number | string>('');

  const [validateSuccessProducts, setValidateSuccessProducts] = useState<ProductsProps[]>([]);
  const [validateFailureProducts, setValidateFailureProducts] = useState<ProductsProps[]>([]);

  const [allowJuniorPlaceOrder, setAllowJuniorPlaceOrder] = useState<boolean>(false);

  const isJuniorApprove = shoppingListInfo?.status === 0 && role === 2;
  const isReadForApprove = shoppingListInfo?.status === 40 || shoppingListInfo?.status === 20;

  const goToShoppingLists = () => {
    navigate('/shoppingLists');
  };

  useEffect(() => {
    dispatch({
      type: 'init',
      payload: {
        id: parseInt(id, 10) || 0,
      },
    });
    // disabling as we dont need a dispatcher here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      try {
        const productIds: number[] = [];
        listProducts.forEach((item) => {
          const { node } = item;
          if (!productIds.includes(node.productId)) {
            productIds.push(node.productId);
          }
        });
        const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts;

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

            return node.productId === productId;
          });

          node.productsSearch = productInfo || {};
          node.productName = productInfo?.name || node.productName;
          node.productUrl = productInfo?.productUrl || node.productUrl;

          node.disableCurrentCheckbox = false;
          if (node.quantity === 0) {
            node.disableCurrentCheckbox = true;
          }
        });

        return listProducts;
      } catch (err: any) {
        snackbar.error(err);
      }
    }

    return [];
  };

  const getShoppingListDetails = async (params: SearchProps) => {
    const shoppingListDetailInfo = isB2BUser
      ? await getB2BShoppingListDetails({ id, ...params })
      : await getBcShoppingListDetails({ id, ...params });

    const {
      products: { edges, totalCount },
    } = shoppingListDetailInfo;

    const listProducts = await handleGetProductsById(edges);

    await calculateProductListPrice(listProducts, '2');

    if (isB2BUser) setCustomerInfo(shoppingListDetailInfo.customerInfo);
    setShoppingListInfo(shoppingListDetailInfo);

    if (!listProducts) {
      return {
        edges: [],
        totalCount: 0,
      };
    }

    return {
      edges: listProducts,
      totalCount,
    };
  };

  const handleUpdateShoppingList = async (status: number) => {
    setIsRequestLoading(true);
    try {
      const params: UpdateShoppingListParamsProps = {
        id: +id,
        name: shoppingListInfo?.name || '',
        description: shoppingListInfo?.description || '',
      };

      if (isB2BUser) {
        await updateB2BShoppingList({
          ...params,
          status,
        });
      } else {
        await updateBcShoppingList({
          ...params,
          channelId,
        });
      }

      snackbar.success(b3Lang('shoppingList.shoppingListStatusUpdated'), {
        isClose: true,
      });
      tableRef.current?.initSearch();
    } finally {
      setIsRequestLoading(false);
    }
  };

  const updateList = () => {
    tableRef.current?.initSearch();
  };

  const handleCancelClick = () => {
    setDeleteOpen(false);
    setDeleteItemId('');
  };

  const handleDeleteItems = async (itemId: number | string = '') => {
    setIsRequestLoading(true);
    const deleteShoppingListItem = isB2BUser ? deleteB2BShoppingListItem : deleteBcShoppingListItem;

    try {
      if (itemId) {
        await deleteShoppingListItem({
          itemId,
          shoppingListId: id,
        });

        if (checkedArr.length > 0) {
          const newCheckedArr = checkedArr.filter((item: ListItemProps) => {
            const { itemId: checkedItemId } = item.node;

            return itemId !== checkedItemId;
          });

          setCheckedArr([...newCheckedArr]);
        }
      } else {
        if (checkedArr.length === 0) return;
        checkedArr.forEach(async (item: ListItemProps) => {
          const { node } = item;

          await deleteShoppingListItem({
            itemId: node.itemId,
            shoppingListId: id,
          });
        });

        setCheckedArr([]);
      }

      snackbar.success(b3Lang('shoppingList.productRemoved'));
    } finally {
      setIsRequestLoading(false);
      updateList();
    }
  };

  useEffect(() => {
    if (checkedArr.length > 0) {
      let total = 0.0;

      checkedArr.forEach((item: ListItemProps) => {
        const {
          node: { quantity, basePrice, taxPrice },
        } = item;

        const price = getBCPrice(+basePrice, +taxPrice);

        total += price * +quantity;
      });

      setSelectedSubTotal((1000 * total) / 1000);
    } else {
      setSelectedSubTotal(0.0);
    }
  }, [checkedArr]);

  const handleDeleteProductClick = async () => {
    await handleDeleteItems(+deleteItemId);
    await handleCancelClick();
  };

  const getJuniorPlaceOrder = async () => {
    const {
      storeConfigSwitchStatus: { isEnabled },
    } = await getB2BJuniorPlaceOrder();

    setAllowJuniorPlaceOrder(isEnabled === '1');
  };

  useEffect(() => {
    if (isJuniorApprove) getJuniorPlaceOrder();
  }, [isJuniorApprove]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <ShoppingDetailHeader
          isB2BUser={isB2BUser}
          shoppingListInfo={shoppingListInfo}
          customerInfo={customerInfo}
          role={role}
          goToShoppingLists={goToShoppingLists}
          handleUpdateShoppingList={handleUpdateShoppingList}
          setOpenPage={setOpenPage}
          isAgenting={isAgenting}
          openAPPParams={openAPPParams}
          customColor={primaryColor}
        />

        <Grid
          container
          spacing={2}
          sx={{
            marginTop: '0',
            overflow: 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingBottom: '20px',
            marginBottom: isMobile ? '6rem' : 0,
          }}
        >
          <Box
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                    pl: '16px',
                  }
                : {
                    flexBasis: '690px',
                    flexGrow: 1,
                    ml: '16px',
                    pt: '16px',
                  }
            }
          >
            <B3Spin isSpinning={isRequestLoading} spinningHeight="auto">
              <Grid
                item
                sx={
                  isMobile
                    ? {
                        flexBasis: '100%',
                      }
                    : {
                        flexBasis: '690px',
                        flexGrow: 1,
                      }
                }
              >
                <ShoppingDetailTable
                  ref={tableRef}
                  isReadForApprove={isReadForApprove}
                  isJuniorApprove={isJuniorApprove}
                  allowJuniorPlaceOrder={allowJuniorPlaceOrder}
                  setCheckedArr={setCheckedArr}
                  shoppingListInfo={shoppingListInfo}
                  isRequestLoading={isRequestLoading}
                  setIsRequestLoading={setIsRequestLoading}
                  shoppingListId={id}
                  getShoppingListDetails={getShoppingListDetails}
                  setDeleteOpen={setDeleteOpen}
                  setDeleteItemId={setDeleteItemId}
                  isB2BUser={isB2BUser}
                  role={role}
                  productQuoteEnabled={productQuoteEnabled}
                />
              </Grid>
            </B3Spin>
          </Box>

          <Grid
            item
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                  }
                : {
                    flexBasis: '340px',
                  }
            }
          >
            {!isReadForApprove && !isJuniorApprove && (
              <AddToShoppingList
                updateList={updateList}
                type="shoppingList"
                isB2BUser={isB2BUser}
              />
            )}
          </Grid>
        </Grid>

        {!isReadForApprove &&
          (allowJuniorPlaceOrder || productQuoteEnabled || !isJuniorApprove) && (
            <ShoppingDetailFooter
              shoppingListInfo={shoppingListInfo}
              role={role}
              allowJuniorPlaceOrder={allowJuniorPlaceOrder}
              checkedArr={checkedArr}
              selectedSubTotal={selectedSubTotal}
              setLoading={setIsRequestLoading}
              setDeleteOpen={setDeleteOpen}
              setValidateFailureProducts={setValidateFailureProducts}
              setValidateSuccessProducts={setValidateSuccessProducts}
              isB2BUser={isB2BUser}
              customColor={primaryColor}
            />
          )}
      </Box>

      <ReAddToCart
        shoppingListInfo={shoppingListInfo}
        role={role}
        products={validateFailureProducts}
        successProducts={validateSuccessProducts.length}
        allowJuniorPlaceOrder={allowJuniorPlaceOrder}
        setValidateFailureProducts={setValidateFailureProducts}
        setValidateSuccessProducts={setValidateSuccessProducts}
        textAlign={isMobile ? 'left' : 'right'}
      />

      <ShoppingDetailDeleteItems
        open={deleteOpen}
        handleCancelClick={handleCancelClick}
        handleDeleteProductClick={handleDeleteProductClick}
      />
    </>
  );
}

function ShoppingListDetailsContent({ setOpenPage }: ShoppingListDetailsContentProps) {
  return (
    <ShoppingListDetailsProvider>
      <ShoppingListDetails setOpenPage={setOpenPage} />
    </ShoppingListDetailsProvider>
  );
}

export default ShoppingListDetailsContent;
