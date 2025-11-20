import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowBackIosNew, InfoOutlined } from '@mui/icons-material';
import { Box, Grid, Stack, Typography } from '@mui/material';

import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import {
  getB2BAddressConfig,
  getB2BOrderDetails,
  getBCOrderDetails,
  getBcOrderStatusType,
  getOrderStatusType,
} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { AddressConfigItem, CustomerRole, OrderProductItem, OrderStatusItem } from '@/types';
import b2bLogger from '@/utils/b3Logger';

import OrderStatus from '../order/components/OrderStatus';
import { orderStatusTranslationVariables } from '../order/shared/getOrderStatus';

import { DetailPagination } from './components/DetailPagination';
import { OrderAction } from './components/OrderAction';
import { OrderBilling } from './components/OrderBilling';
import { OrderHistory } from './components/OrderHistory';
import { OrderShipping } from './components/OrderShipping';
import { OrderDetailsContext, OrderDetailsProvider } from './context/OrderDetailsContext';
import convertB2BOrderDetails from './shared/B2BOrderData';

interface LocationState {
  isCompanyOrder: boolean;
}

function OrderDetail() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const companyId =
    role === CustomerRole.SUPER_ADMIN && isAgenting
      ? Number(salesRepCompanyId)
      : Number(companyInfoId);
  const currentCompanyId = Number(selectCompanyHierarchyId) || companyId;

  const params = useParams();

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const {
    state: { addressConfig },
    dispatch: globalDispatch,
  } = useContext(GlobalContext);

  const {
    state: {
      poNumber,
      status = '',
      customStatus,
      orderSummary,
      orderStatus = [],
      products,
      digitalProducts,
    },
    state: detailsData,
    dispatch,
  } = useContext(OrderDetailsContext);

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const location = useLocation();

  const [isMobile] = useMobile();
  const [preOrderId, setPreOrderId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isCurrentCompany, setIsCurrentCompany] = useState(false);

  useEffect(() => {
    setOrderId(params.id || '');
  }, [params]);

  const goToOrders = () => {
    navigate((location.state as LocationState).isCompanyOrder ? '/company-orders' : '/orders');
  };

  useEffect(() => {
    if (orderId) {
      const getOrderDetails = async () => {
        const id = parseInt(orderId, 10);
        if (!id) {
          return;
        }

        setIsRequestLoading(true);

        try {
          const order = isB2BUser ? await getB2BOrderDetails(id) : await getBCOrderDetails(id);

          if (order) {
            const { products, companyInfo } = order;

            const newOrder = {
              ...order,
              products: products.map((item: OrderProductItem) => {
                return {
                  ...item,
                  imageUrl: item?.variantImageUrl || item.imageUrl,
                };
              }),
            };

            setIsCurrentCompany(Number(companyInfo.companyId) === Number(currentCompanyId));

            const data = convertB2BOrderDetails(newOrder, b3Lang);
            dispatch({
              type: 'all',
              payload: data,
            });
            setPreOrderId(orderId);
          }
        } catch (err) {
          if (err === 'order does not exist') {
            setTimeout(() => {
              window.location.hash = `/orderDetail/${preOrderId}`;
            }, 1000);
          }
        } finally {
          setIsRequestLoading(false);
        }
      };

      const getOrderStatus = async () => {
        const orderStatus = isB2BUser ? await getOrderStatusType() : await getBcOrderStatusType();

        dispatch({
          type: 'statusType',
          payload: {
            orderStatus,
          },
        });
      };

      getOrderDetails();
      getOrderStatus();
    }
    // Disabling rule since dispatch does not need to be in the dep array and b3Lang has rendering errors
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isB2BUser, orderId, preOrderId, selectCompanyHierarchyId]);

  const handlePageChange = (orderId: string | number) => {
    setOrderId(orderId.toString());
  };

  useEffect(() => {
    const getAddressLabelPermission = async () => {
      try {
        let configList = addressConfig;
        if (!configList) {
          const { addressConfig: newConfig } = await getB2BAddressConfig();
          configList = newConfig;

          globalDispatch({
            type: 'common',
            payload: {
              addressConfig: configList,
            },
          });
        }

        const permission =
          (configList || []).find((config: AddressConfigItem) => config.key === 'address_label')
            ?.isEnabled === '1';
        dispatch({
          type: 'addressLabel',
          payload: {
            addressLabelPermission: permission,
          },
        });
      } catch (error) {
        b2bLogger.error(error);
      }
    };
    getAddressLabelPermission();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOrderStatusLabel = (status: string) => {
    const currentOrderStatus = orderStatus.find(
      (item: OrderStatusItem) => item.systemLabel === status,
    );
    let activeStatusLabel = currentOrderStatus?.customLabel || customStatus;
    if (currentOrderStatus) {
      const optionLabel = orderStatusTranslationVariables[currentOrderStatus.systemLabel];
      activeStatusLabel =
        optionLabel && b3Lang(optionLabel) !== currentOrderStatus.systemLabel
          ? b3Lang(optionLabel)
          : activeStatusLabel;
    }
    return activeStatusLabel;
  };

  return (
    <B3Spin isSpinning={isRequestLoading} background="rgba(255,255,255,0.2)">
      <Box
        sx={{
          overflow: 'auto',
          flex: 1,
        }}
      >
        <Box
          sx={{
            marginBottom: '10px',
            width: 'fit-content',
          }}
        >
          <Box
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={goToOrders}
          >
            {location.state !== null ? (
              <>
                <ArrowBackIosNew
                  sx={{
                    fontSize: '13px',
                    margin: '0 8px',
                  }}
                />
                <span>{b3Lang('orderDetail.backToOrders')}</span>
              </>
            ) : (
              ''
            )}
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid
            item
            xs={isMobile ? 12 : 8}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              order: isMobile ? 1 : 0,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: b3HexToRgb(customColor, 0.87) || '#263238',
              }}
            >
              {b3Lang('orderDetail.orderId', { orderId })}
              {b3Lang('orderDetail.purchaseOrderNumber', {
                purchaseOrderNumber: poNumber ?? '',
              })}
            </Typography>
            <OrderStatus code={status} text={getOrderStatusLabel(status)} />
          </Grid>
          <Grid
            container
            item
            xs={isMobile ? 12 : 4}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {location?.state && (
              <DetailPagination
                onChange={(orderId) => handlePageChange(orderId)}
                color={customColor}
              />
            )}
          </Grid>
        </Grid>
        {products?.length && !isCurrentCompany ? (
          <Box
            sx={{
              marginTop: '24px',
              height: '48px',
              padding: '6px 16px',
              borderRadius: '4px',
              backgroundColor: '#0288D1',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <InfoOutlined
              color="primary"
              sx={{
                color: '#FFFFFF',
              }}
            />
            <Typography
              sx={{
                color: '#FFFFFF',
                marginLeft: '8px',
                fontSize: '14px',
              }}
            >
              {b3Lang('orderDetail.anotherCompany.tips')}
            </Typography>
          </Box>
        ) : null}

        <Grid
          container
          spacing={2}
          sx={{
            marginTop: '0',
            overflow: 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingBottom: '20px',
          }}
        >
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
            <Stack spacing={3}>
              <OrderShipping isCurrentCompany={isCurrentCompany} />
              {/* Digital Order Display */}
              {!!digitalProducts?.length && <OrderBilling isCurrentCompany={isCurrentCompany} />}
              <OrderHistory />
            </Stack>
          </Grid>
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
            {JSON.stringify(orderSummary) === '{}' ? null : (
              <OrderAction detailsData={detailsData} isCurrentCompany={isCurrentCompany} />
            )}
          </Grid>
        </Grid>
      </Box>
    </B3Spin>
  );
}

function OrderDetailsContent() {
  return (
    <OrderDetailsProvider>
      <OrderDetail />
    </OrderDetailsProvider>
  );
}

export default OrderDetailsContent;
