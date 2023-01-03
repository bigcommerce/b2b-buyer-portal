import {
  useParams,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  useEffect,
  useState,
  useContext,
} from 'react'

import {
  Box,
  Grid,
  Typography,
  Stack,
} from '@mui/material'

import {
  getB2BOrderDetails,
  getBCOrderDetails,
  getOrderStatusType,
  getBcOrderStatusType,
  getB2BAddressConfig,
} from '@/shared/service/b2b'

import {
  useMobile,
} from '@/hooks'

import {
  OrderStatus,
} from '../order/components'

import {
  OrderShipping,
  OrderHistory,
  DetailPagination,
  OrderAction,
} from './components'

import {
  convertB2BOrderDetails,
} from './shared/B2BOrderData'

import {
  convertBCOrderDetails,
} from './shared/BCOrderData'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  OrderDetailsContext,
  OrderDetailsProvider,
} from './context/OrderDetailsContext'

import {
  OrderStatusResponse,
  OrderDetailsResponse,
  AddressConfigItem,
} from '../../types'

interface LocationState {
  isCompanyOrder: boolean,
}

const OrderDetail = () => {
  const params = useParams()

  const navigate = useNavigate()

  const {
    state: {
      isB2BUser,
      addressConfig,
    },
    dispatch: globalDispatch,
  } = useContext(GlobaledContext)

  const {
    state: {
      poNumber,
      status = '',
      customStatus,
      orderSummary,
    },
    state: detailsData,
    dispatch,
  } = useContext(OrderDetailsContext)

  const localtion = useLocation()

  const [isMobile] = useMobile()
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
        const data = isB2BUser ? convertB2BOrderDetails(order) : convertBCOrderDetails(order)
        dispatch({
          type: 'all',
          payload: data,
        })
      }
    } finally {
      setIsRequestLoading(false)
    }
  }

  const goToOrders = () => {
    navigate(`${(localtion.state as LocationState).isCompanyOrder ? '/company-orders' : '/orders'}`)
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
        const {
          addressConfig: newConfig,
        }: CustomFieldItems = await getB2BAddressConfig()
        configList = newConfig

        globalDispatch({
          type: 'common',
          payload: {
            addressConfig: configList,
          },
        })
      }

      const permission = (configList || []).find((config: AddressConfigItem) => config.key === 'address_label')?.isEnabled === '1'
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

  return (
    <B3Sping
      isSpinning={isRequestLoading}
      background="rgba(255,255,255,0.2)"
    >
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
              color: '#1976d2',
              cursor: 'pointer',
            }}
            onClick={goToOrders}
          >
            {
              localtion.state !== null ? 'Back to orders' : ''
            }
          </Box>
        </Box>

        <Grid
          container
          spacing={2}
        >
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
            <Typography variant="h4">{`#${orderId}`}</Typography>
            {poNumber && <Typography variant="body2">{poNumber}</Typography>}
            <OrderStatus
              code={status}
              text={customStatus}
            />
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
            <DetailPagination
              onChange={(orderId) => handlePageChange(orderId)}
            />
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
            sx={isMobile ? {
              flexBasis: '100%',
            } : {
              flexBasis: '690px',
              flexGrow: 1,
            }}
          >
            <Stack spacing={3}>
              <OrderShipping />

              <OrderHistory />
            </Stack>
          </Grid>
          <Grid
            item
            sx={isMobile ? {
              flexBasis: '100%',
            } : {
              flexBasis: '340px',
            }}
          >
            {
              JSON.stringify(orderSummary) === '{}' ? (<></>) : (
                <OrderAction
                  detailsData={detailsData}
                />
              )
            }
          </Grid>
        </Grid>
      </Box>
    </B3Sping>
  )
}

const OrderDetailsContent = () => (
  <OrderDetailsProvider>
    <OrderDetail />
  </OrderDetailsProvider>
)

export default OrderDetailsContent
