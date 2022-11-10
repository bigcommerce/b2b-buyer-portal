import {
  useState,
  useContext,
  Fragment,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'

import {
  Card,
  CardContent,
  Typography,
  Button,
} from '@mui/material'
import styled from '@emotion/styled'

import {
  format,
} from 'date-fns'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  OrderDialog,
} from './OrderDialog'

const OrderActionContainer = styled('div')(() => ({}))

/// orderCard
const InformationContainer = styled('div')(() => ({
  background: '#F5F5F5',
  padding: '1rem',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: '4px',
  marginTop: '0.5rem',
}))

const OrderCardHeader = styled(Typography)(() => ({
  padding: '1rem 0 0 1rem',
}))

const StyledCardActions = styled('div')(() => ({
  flexWrap: 'wrap',
  padding: '0 1rem 1rem 1rem',

  '& button': {
    marginLeft: '0',
    marginRight: '8px',
    margin: '8px 8px 0 0',
  },
}))

const ItemContainer = styled('div')((props: any) => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: props.nameKey === 'Grand total' ? 700 : 400,

  '& p': {
    marginTop: 0,
  },
}))

const PaymentItemContainer = styled('div')((props: any) => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 400,
  marginBottom: props.isAddMarginButton && '0.8rem',
}))

const StyledCurrency = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '40%',
  justifyContent: 'space-between',
}))

const OrderCard = (props: any) => {
  const {
    header,
    subtitle,
    buttons,
    infos,
    products,
    itemKey,
    orderId,
    currencyInfo,
  } = props

  const navigate = useNavigate()

  const dialogData = [
    {
      dialogTitle: 'Re-order',
      type: 'reOrder',
      description: 'Select products and quantity for reorder',
      confirmText: 'Add to cart',
    },
    {
      dialogTitle: 'Return',
      type: 'return',
      description: 'Select products and quantity for return',
      confirmText: 'Submit return request',
    },
    {
      dialogTitle: 'Add to shipping list',
      type: 'shippingList',
      description: 'Select products and quantity to add to shopping list',
      confirmText: 'Add to shopping list',
    },
  ]

  const infoType = typeof infos
  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')
  const [currentDialogData, setCurrentDialogData] = useState<any>({})

  let infoKey: any
  let infoValue: any
  if (infoType !== 'string') {
    const {
      info,
    } = infos

    infoKey = Object.keys(info)
    infoValue = Object.values(info)
  }

  const handleOpenDialog = (e: any) => {
    const {
      name,
    } = e.target

    if (name === 'viewInvoice') {
      // TODO:
      navigate('/invoiceDetail/1')
    } else if (name === 'printInvoice') {
      // TODO:
      window.open(`/account.php?action=print_invoice&order_id=${orderId}`)
    } else if (name === 'return') {
      // TODO
    } else {
      setOpen(true)
      setType(name)

      const newDialogData = dialogData.find((data: any) => data.type === name)
      setCurrentDialogData(newDialogData)
    }
  }

  return (
    <Card
      sx={{
        marginBottom: '1rem',
      }}
    >
      <OrderCardHeader variant="h5">
        {header}
      </OrderCardHeader>
      <CardContent>
        {
          subtitle && <div>{subtitle}</div>
        }
        <InformationContainer>
          {
            infoType === 'string' ? (
              infos
            ) : (
              <>
                {
                  infos.money ? (
                    infoKey && infoKey.map((key: string, index: number) => (
                      <ItemContainer
                        key={key}
                        nameKey={key}
                      >
                        <p>{key}</p>
                        <StyledCurrency>
                          <p>{infos.money?.currency_token}</p>
                          <p>{infoValue[index]}</p>
                        </StyledCurrency>
                      </ItemContainer>
                    ))
                  ) : (
                    infoValue && infoValue.map((value: any, index: number) => (
                      <PaymentItemContainer
                        key={value}
                        isAddMarginButton={(infoKey[index] === 'paymentMethod' || infoKey[index] === 'company')}
                      >
                        {value}
                      </PaymentItemContainer>
                    ))
                  )
                }
              </>
            )
          }
        </InformationContainer>
      </CardContent>
      <StyledCardActions>
        {
          buttons && buttons.map((button: any) => (
            <Fragment key={button.key}>
              {
                button.isCanShow && (
                  <Button
                    value={button.value}
                    key={button.key}
                    name={button.name}
                    variant={button.variant}
                    onClick={(e) => { handleOpenDialog(e) }}
                  >
                    {button.value}
                  </Button>
                )
              }
            </Fragment>
          ))
        }
      </StyledCardActions>

      <OrderDialog
        open={open}
        products={products}
        currentDialogData={currentDialogData}
        type={type}
        setOpen={setOpen}
        itemKey={itemKey}
        currencyInfo={currencyInfo}
      />
    </Card>
  )
}

export const OrderAction = (props: any) => {
  const {
    detailsData,
  } = props
  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const {
    money,
    orderSummary: {
      createAt,
      name,
      priceData,
    },
    payment: {
      updatedAt,
      billingAddress,
      paymentMethod,
    },
    orderComments,
    products,
    orderId,
    ipStatus,
  } = detailsData

  const getFullPaymentAddress = (billingAddress: any) => {
    const {
      first_name: firstName,
      last_name: lastName,
      company,
      street_1: street1,
      state,
      zip,
      country,
      city,
    } = billingAddress
    const paymentAddress = {
      paymentMethod: `Payment by ${paymentMethod}`,
      name: `${firstName} ${lastName}`,
      company,
      street: street1,
      address: `${city}, ${state} ${zip}, ${country}`,
    }

    return paymentAddress
  }

  const handleOrderComments = (value: string) => {
    const commentsArr = value.split(/\n/g)

    const comments: any = {}

    commentsArr.forEach((item, index) => {
      if (item.trim().length > 0) {
        const isHaveTitle = item.trim().includes(':')

        const message = isHaveTitle ? item : `Comments: ${item}`

        comments[`mes${index}`] = message
      }
    })

    return comments
  }

  const buttons = [
    {
      value: 'Re-Order',
      key: 'Re-Order',
      name: 'reOrder',
      variant: 'outlined',
      isCanShow: true,
    },
    {
      value: 'Return',
      key: 'Return',
      name: 'return',
      variant: 'outlined',
      isCanShow: true,
    },
    {
      value: 'ADD TO SHOPPING LIST',
      key: 'add-to-shipping-list',
      name: 'shippingList',
      variant: 'outlined',
      isCanShow: isB2BUser,
    },
  ]

  const orderData = [
    {
      header: 'Order summary',
      key: 'order-summary',
      subtitle: `Purchased by ${name} on ${format(+updatedAt * 1000, 'dd MMM yy')}.`,
      buttons,
      infos: {
        money,
        info: priceData,
      },
    },
    {
      header: 'Payment',
      key: 'payment',
      subtitle: `Paid in full on ${format(Date.parse(createAt), 'dd MMM yy')}.`,
      buttons: [
        {
          value: isB2BUser ? 'view invoice' : 'print invoice',
          key: 'aboutInvoice',
          name: isB2BUser ? 'viewInvoice' : 'printInvoice',
          variant: 'outlined',
          isCanShow: !isB2BUser || +ipStatus !== 0,
        },
      ],
      infos: {
        info: getFullPaymentAddress(billingAddress),
      },
    },
    {
      header: 'Order comments',
      key: 'order-comments',
      subtitle: '',
      buttons: [],
      infos: {
        info: handleOrderComments(orderComments),
      },
    },
  ]

  return (
    <OrderActionContainer>
      {
        orderData && orderData.map((item: any) => (
          <OrderCard
            key={item.key}
            products={products}
            orderId={orderId}
            currencyInfo={money}
            {...item}
            itemKey={item.key}
          />
        ))
      }
    </OrderActionContainer>
  )
}
