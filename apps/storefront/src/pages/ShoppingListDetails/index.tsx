import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, useTheme } from '@mui/material';

import B3Spin from '@/components/spin/B3Spin';
import { useFeatureFlags, useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  deleteB2BShoppingListItem,
  deleteBcShoppingListItem,
  getB2BJuniorPlaceOrder,
  getB2BShoppingListDetails,
  getBcShoppingListDetails,
  searchProducts,
  updateB2BShoppingList,
  updateBcShoppingList,
} from '@/shared/service/b2b';
import {
  activeCurrencyInfoSelector,
  isB2BUserSelector,
  rolePermissionSelector,
  useAppSelector,
} from '@/store';
import { CustomerRole } from '@/types/company';
import { ShoppingListStatus } from '@/types/shoppingList';
import { channelId, snackbar, verifyLevelPermission } from '@/utils';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';
import { calculateProductListPrice, getBCPrice } from '@/utils/b3Product/b3Product';
import {
  conversionProductsList,
  CustomerInfoProps,
  ListItemProps,
  ProductsProps,
  SearchProps,
  ShoppingListInfoProps,
} from '@/utils/b3Product/shared/config';

import { type PageProps } from '../PageProps';

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

interface UpdateShoppingListParamsProps {
  id: number;
  name: string;
  description: string;
  status?: number;
  channelId?: number;
}

const calculateSubTotal = (checkedArr: CustomFieldItems) => {
  if (checkedArr.length > 0) {
    let total = 0.0;

    checkedArr.forEach((item: ListItemProps) => {
      const {
        node: { quantity, basePrice, taxPrice },
      } = item;

      const price = getBCPrice(Number(basePrice), Number(taxPrice));

      total += price * Number(quantity);
    });

    return (1000 * total) / 1000;
  }
  return 0.0;
};

function useData() {
  const { id = '' } = useParams();
  const {
    state: { openAPPParams, productQuoteEnabled = false },
  } = useContext(GlobalContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const {
    shoppingListCreateActionsPermission,
    purchasabilityPermission,
    submitShoppingListPermission,
  } = useAppSelector(rolePermissionSelector);

  const isCanAddToCart = isB2BUser ? purchasabilityPermission : true;

  const getProducts = async (productIds: number[]) => {
    const options = { productIds, currencyCode, companyId, customerGroupId };
    const { productsSearch } = await searchProducts(options);

    return conversionProductsList(productsSearch);
  };

  const getShoppingList = (params: SearchProps) => {
    const options = { ...params, id };

    return isB2BUser ? getB2BShoppingListDetails(options) : getBcShoppingListDetails(options);
  };

  const deleteShoppingListItem = (itemId: string | number) => {
    const options = { itemId, shoppingListId: id };

    return isB2BUser ? deleteB2BShoppingListItem(options) : deleteBcShoppingListItem(options);
  };

  return {
    id,
    openAPPParams,
    productQuoteEnabled,
    isB2BUser,
    role,
    isAgenting,
    primaryColor,
    shoppingListCreateActionsPermission,
    submitShoppingListPermission,
    isCanAddToCart,
    getProducts,
    getShoppingList,
    deleteShoppingListItem,
  };
}

// 0: Admin, 1: Senior buyer, 2: Junior buyer, 3: Super admin

function ShoppingListDetails({ setOpenPage }: PageProps) {
  const {
    id,
    openAPPParams,
    productQuoteEnabled,
    isB2BUser,
    role,
    isAgenting,
    primaryColor,
    shoppingListCreateActionsPermission,
    submitShoppingListPermission,
    isCanAddToCart,
    getProducts,
    getShoppingList,
    deleteShoppingListItem,
  } = useData();
  const navigate = useNavigate();
  const [isMobile] = useMobile();
  const { dispatch } = useContext(ShoppingListDetailsContext);

  const b3Lang = useB3Lang();

  const tableRef = useRef<TableRefProps | null>(null);

  const featureFlags = useFeatureFlags();
  const backendValidationEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'] ?? false;

  const [checkedArr, setCheckedArr] = useState<CustomFieldItems>([]);
  const [shoppingListInfo, setShoppingListInfo] = useState<null | ShoppingListInfoProps>(null);
  const [customerInfo, setCustomerInfo] = useState<null | CustomerInfoProps>(null);
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<number | string>('');

  const [validateSuccessProducts, setValidateSuccessProducts] = useState<ProductsProps[]>([]);
  const [validateFailureProducts, setValidateFailureProducts] = useState<ProductsProps[]>([]);

  const [allowJuniorPlaceOrder, setAllowJuniorPlaceOrder] = useState<boolean>(false);
  const [isCanEditShoppingList, setIsCanEditShoppingList] = useState<boolean>(true);

  const b2bAndBcShoppingListActionsPermissions = isB2BUser
    ? shoppingListCreateActionsPermission && isCanEditShoppingList
    : true;

  const submitShoppingList = useMemo(() => {
    if (isB2BUser && shoppingListInfo) {
      const { companyInfo, customerInfo } = shoppingListInfo;
      const { submitShoppingListPermission: submitShoppingListPermissionCode } = b2bPermissionsMap;
      const submitShoppingListPermissionLevel = verifyLevelPermission({
        code: submitShoppingListPermissionCode,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo?.userId || 0),
      });

      return submitShoppingListPermissionLevel;
    }

    return submitShoppingListPermission;
  }, [submitShoppingListPermission, isB2BUser, shoppingListInfo]);
  const b2bSubmitShoppingListPermission = isB2BUser
    ? submitShoppingList
    : role === CustomerRole.JUNIOR_BUYER;

  const isJuniorApprove =
    shoppingListInfo?.status === ShoppingListStatus.Approved && b2bSubmitShoppingListPermission;

  const isReadForApprove =
    shoppingListInfo?.status === ShoppingListStatus.ReadyForApproval ||
    shoppingListInfo?.status === ShoppingListStatus.Rejected ||
    // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
    // We need to add Deleted here so that the shopping lists that were previously rejected remain the same behavior
    shoppingListInfo?.status === ShoppingListStatus.Deleted;

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
    // disabling as we don't need a dispatcher here
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

        const newProductsSearch = await getProducts(productIds);

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
    const shoppingListDetailInfo = await getShoppingList(params);
    setIsRequestLoading(true);
    const {
      products: { edges, totalCount },
    } = shoppingListDetailInfo;

    const listProducts = await handleGetProductsById(edges);

    await calculateProductListPrice(listProducts, '2');

    if (isB2BUser) setCustomerInfo(shoppingListDetailInfo.customerInfo);
    setShoppingListInfo(shoppingListDetailInfo);
    setIsRequestLoading(false);
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
        id: Number(id),
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

      snackbar.success(b3Lang('shoppingList.shoppingListStatusUpdated'));
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

    try {
      if (itemId) {
        await deleteShoppingListItem(itemId);

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

          await deleteShoppingListItem(node.itemId);
        });

        setCheckedArr([]);
      }

      snackbar.success(b3Lang('shoppingList.productRemoved'));
    } finally {
      setIsRequestLoading(false);
      updateList();
    }
  };

  const handleDeleteProductClick = async () => {
    await handleDeleteItems(Number(deleteItemId));
    await handleCancelClick();
  };

  const getJuniorPlaceOrder = async () => {
    const {
      storeConfigSwitchStatus: { isEnabled },
    } = await getB2BJuniorPlaceOrder();

    setAllowJuniorPlaceOrder(isEnabled === '1' && isCanAddToCart);
  };

  useEffect(() => {
    if (isJuniorApprove) getJuniorPlaceOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJuniorApprove]);

  useEffect(() => {
    if (isB2BUser && shoppingListInfo) {
      const { companyInfo, customerInfo } = shoppingListInfo;

      const { shoppingListCreateActionsPermission } = b2bPermissionsMap;
      const shoppingListActionsPermission = verifyLevelPermission({
        code: shoppingListCreateActionsPermission,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo?.userId || 0),
      });

      setIsCanEditShoppingList(shoppingListActionsPermission);
    }
  }, [shoppingListInfo, isB2BUser]);

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
                  productQuoteEnabled={productQuoteEnabled}
                  isCanEditShoppingList={isCanEditShoppingList}
                  role={role}
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
            {b2bAndBcShoppingListActionsPermissions && !isReadForApprove && !isJuniorApprove && (
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
              allowJuniorPlaceOrder={allowJuniorPlaceOrder}
              checkedArr={checkedArr}
              selectedSubTotal={calculateSubTotal(checkedArr)}
              setLoading={setIsRequestLoading}
              setDeleteOpen={setDeleteOpen}
              setValidateFailureProducts={setValidateFailureProducts}
              setValidateSuccessProducts={setValidateSuccessProducts}
              isB2BUser={isB2BUser}
              customColor={primaryColor}
              isCanEditShoppingList={isCanEditShoppingList}
              role={role}
              backendValidationEnabled={backendValidationEnabled}
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
        backendValidationEnabled={backendValidationEnabled}
      />

      <ShoppingDetailDeleteItems
        open={deleteOpen}
        handleCancelClick={handleCancelClick}
        handleDeleteProductClick={handleDeleteProductClick}
      />
    </>
  );
}

function ShoppingListDetailsContent({ setOpenPage }: PageProps) {
  return (
    <ShoppingListDetailsProvider>
      <ShoppingListDetails setOpenPage={setOpenPage} />
    </ShoppingListDetailsProvider>
  );
}

export default ShoppingListDetailsContent;
