import { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import { ArrowBackIosNew } from '@mui/icons-material'
import { Box, Grid, Stack, Typography } from '@mui/material'

import { B3Sping } from '@/components'
import {
  b3HexToRgb,
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import {
  getB2BAddressConfig,
  getB2BOrderDetails,
  getBCOrderDetails,
  getBcOrderStatusType,
  getOrderStatusType,
} from '@/shared/service/b2b'

import {
  AddressConfigItem,
  OrderDetailsResponse,
  OrderStatusItem,
  OrderStatusResponse,
} from '../../types'
import OrderStatus from '../order/components/OrderStatus'

import {
  OrderDetailsContext,
  OrderDetailsProvider,
} from './context/OrderDetailsContext'
import convertB2BOrderDetails from './shared/B2BOrderData'
import {
  DetailPagination,
  OrderAction,
  OrderBilling,
  OrderHistory,
  OrderShipping,
} from './components'

const convertBCOrderDetails = convertB2BOrderDetails

interface LocationState {
  isCompanyOrder: boolean
}

function OrderDetail() {
  const params = useParams()

  const navigate = useNavigate()

  const b3Lang = useB3Lang()

  const {
    state: { isB2BUser, addressConfig },
    dispatch: globalDispatch,
  } = useContext(GlobaledContext)

  const {
    state: {
      poNumber,
      status = '',
      customStatus,
      orderSummary,
      orderStatus = [],
    },
    state: detailsData,
    dispatch,
  } = useContext(OrderDetailsContext)

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  const localtion = useLocation()

  const [isMobile] = useMobile()
  const [preOrderId, setPreOrderId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [isRequestLoading, setIsRequestLoading] = useState(false)

  useEffect(() => {
    setOrderId(params.id || '')
  }, [params])

  const getOrderDetails = async () => {
    const id = parseInt(orderId, 10)
    if (!id) {
      return
    }

    setIsRequestLoading(true)

    try {
      const req = isB2BUser ? getB2BOrderDetails : getBCOrderDetails
      const res: OrderDetailsResponse = await req(id)

      const order = res[isB2BUser ? 'order' : 'customerOrder']

      if (order) {
        const data = isB2BUser
          ? convertB2BOrderDetails(order, b3Lang)
          : convertBCOrderDetails(order, b3Lang)
        dispatch({
          type: 'all',
          payload: data,
        })
        setPreOrderId(orderId)
      }
    } catch (err) {
      if (err === 'order does not exist') {
        setTimeout(() => {
          window.location.hash = `/orderDetail/${preOrderId}`
        }, 1000)
      }
    } finally {
      setIsRequestLoading(false)
    }
  }

  const goToOrders = () => {
    navigate(
      `${
        (localtion.state as LocationState).isCompanyOrder
          ? '/company-orders'
          : '/orders'
      }`
    )
  }

  const getOrderStatus = async () => {
    const fn = isB2BUser ? getOrderStatusType : getBcOrderStatusType
    const orderStatusesName = isB2BUser ? 'orderStatuses' : 'bcOrderStatuses'
    const orderStatuses: OrderStatusResponse = await fn()
    dispatch({
      type: 'statusType',
      payload: {
        orderStatus: orderStatuses[orderStatusesName],
      },
    })
  }

  useEffect(() => {
    if (orderId) {
      getOrderDetails()
      getOrderStatus()
    }
  }, [orderId])

  const handlePageChange = (orderId: string | number) => {
    setOrderId(orderId.toString())
  }

  const getAddressLabelPermission = async () => {
    try {
      let configList = addressConfig
      if (!configList) {
        const { addressConfig: newConfig }: CustomFieldItems =
          await getB2BAddressConfig()
        configList = newConfig

        globalDispatch({
          type: 'common',
          payload: {
            addressConfig: configList,
          },
        })
      }

      const permission =
        (configList || []).find(
          (config: AddressConfigItem) => config.key === 'address_label'
        )?.isEnabled === '1'
      dispatch({
        type: 'addressLabel',
        payload: {
          addressLabelPermission: permission,
        },
      })
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getAddressLabelPermission()
  }, [])

  const getOrderStatusLabel = (status: string) =>
    orderStatus.find((item: OrderStatusItem) => item.systemLabel === status)
      ?.customLabel || customStatus

  return (
    <B3Sping isSpinning={isRequestLoading} background="rgba(255,255,255,0.2)">
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
            {localtion.state !== null ? (
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
                purchaseOrderNumber: poNumber,
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
            {localtion?.state && (
              <DetailPagination
                onChange={(orderId) => handlePageChange(orderId)}
                color={customColor}
              />
            )}
          </Grid>
        </Grid>

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
              <OrderShipping />
              {/* Digital Order Display */}
              <OrderBilling />

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
              <OrderAction detailsData={detailsData} />
            )}
            <OrderAction detailsData={detailsData} />
          </Grid>
        </Grid>
      </Box>
    </B3Sping>
  )
}

function OrderDetailsContent() {
  return (
    <OrderDetailsProvider>
      <OrderDetail />
    </OrderDetailsProvider>
  )
}

export default OrderDetailsContent
