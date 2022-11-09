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

interface LocationState {
  isCompanyOrder: boolean,
}

const OrderDetail = () => {
  const params = useParams()

  const navigate = useNavigate()

  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const localtion = useLocation()

  const [isMobile] = useMobile()
  const [orderId, setOrderId] = useState('')
  const [isRequestLoading, setIsRequestLoading] = useState(false)

  useEffect(() => {
    setOrderId(params.id || '')
  }, [params])

  const [detailsData, setDetailsData] = useState({
    shippings: [],
    history: [],
    poNumber: '',
    status: '',
    statusCode: '',
    currencyCode: '',
    orderSummary: {},
  })

  const getOrderDetails = async () => {
    const id = parseInt(orderId, 10)
    if (!id) {
      return
    }

    setIsRequestLoading(true)

    try {
      if (isB2BUser) {
        const {
          order,
        }: any = await getB2BOrderDetails(id)
        setDetailsData(convertB2BOrderDetails(order))
      } else {
        const {
          customerOrder,
        }: any = await getBCOrderDetails(id)
        setDetailsData(convertBCOrderDetails(customerOrder))
      }
    } finally {
      setIsRequestLoading(false)
    }
  }

  const goToOrders = () => {
    navigate(`${(localtion.state as LocationState).isCompanyOrder ? '/company-orders' : '/orders'}`)
  }

  useEffect(() => {
    getOrderDetails()
  }, [orderId])

  const handlePageChange = (orderId: string | number) => {
    setOrderId(orderId.toString())
  }

  const {
    shippings,
    history,
    poNumber,
    status,
    orderSummary,
  } = detailsData

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
          }}
        >
          <Box
            sx={{
              color: '#1976d2',
            }}
            onClick={goToOrders}
          >
            Back to orders
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
            <Typography variant="h4">{`Order #${orderId}`}</Typography>
            {poNumber && <Typography variant="body2">{poNumber}</Typography>}
            <OrderStatus code={status} />
          </Grid>
          <Grid
            container
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
              <OrderShipping shippings={shippings} />

              <OrderHistory history={history} />
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

export default OrderDetail
