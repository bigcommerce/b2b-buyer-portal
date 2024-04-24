import { Fragment, ReactNode, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import styled from '@emotion/styled'
import { Box, Card, CardContent, Divider, Typography } from '@mui/material'
import throttle from 'lodash-es/throttle'

import CustomButton from '@/components/button/CustomButton'
import { isB2BUserSelector, useAppSelector } from '@/store'
import {
  b2bPrintInvoice,
  currencyFormat,
  displayFormat,
  ordersCurrencyFormat,
  snackbar,
} from '@/utils'

import { Address, MoneyFormat, OrderProductItem } from '../../../types'
import {
  OrderDetailsContext,
  OrderDetailsState,
} from '../context/OrderDetailsContext'

import OrderDialog from './OrderDialog'

const OrderActionContainer = styled('div')(() => ({}))

interface StyledCardActionsProps {
  isShowButtons: boolean
}

const StyledCardActions = styled('div')((props: StyledCardActionsProps) => ({
  flexWrap: 'wrap',
  padding: props.isShowButtons ? '0 1rem 1rem 1rem' : 0,

  '& button': {
    marginLeft: '0',
    marginRight: '8px',
    margin: '8px 8px 0 0',
  },
}))

interface ItemContainerProps {
  nameKey: string
}

const ItemContainer = styled('div')((props: ItemContainerProps) => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: props.nameKey === 'Grand total' ? 700 : 400,

  '& p': {
    marginTop: 0,
    marginBottom: props.nameKey === 'Grand total' ? '0' : '12px',
    lineHeight: 1,
  },
}))

const PaymentItemContainer = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 400,
}))

interface Infos {
  info: {
    [k: string]: string
  }
  money?: MoneyFormat
}

interface Buttons {
  value: string
  key: string
  name: string
  variant?: 'text' | 'contained' | 'outlined'
  isCanShow: boolean
}

interface OrderCardProps {
  header: string
  subtitle: string
  buttons: Buttons[]
  infos: Infos | string
  products: OrderProductItem[]
  itemKey: string
  orderId: string
  role: number | string
  ipStatus: number
  invoiceId?: number | string | undefined | null
}

interface DialogData {
  dialogTitle: string
  type: string
  description: string
  confirmText: string
}

function OrderCard(props: OrderCardProps) {
  const {
    header,
    subtitle,
    buttons,
    infos,
    products,
    itemKey,
    orderId,
    role,
    invoiceId,
    ipStatus,
  } = props

  const b3Lang = useB3Lang()

  const isAgenting = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting
  )

  const dialogData = [
    {
      dialogTitle: b3Lang('orderDetail.orderCard.reorder'),
      type: 'reOrder',
      description: b3Lang('orderDetail.orderCard.reorderDescription'),
      confirmText: b3Lang('orderDetail.orderCard.reorderConfirmText'),
    },
    {
      dialogTitle: b3Lang('orderDetail.orderCard.return'),
      type: 'return',
      description: b3Lang('orderDetail.orderCard.returnDescription'),
      confirmText: b3Lang('orderDetail.orderCard.returnConfirmText'),
    },
    {
      dialogTitle: b3Lang('orderDetail.orderCard.addToShoppingList'),
      type: 'shoppingList',
      description: b3Lang('orderDetail.orderCard.addToShoppingListDescription'),
      confirmText: b3Lang('orderDetail.orderCard.addToShoppingListConfirmText'),
    },
  ]

  const navigate = useNavigate()

  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')
  const [currentDialogData, setCurrentDialogData] = useState<DialogData>()
  const isShowButtons = buttons.filter((btn) => btn.isCanShow).length > 0

  let infoKey: string[] = []
  let infoValue: string[] = []
  if (typeof infos !== 'string') {
    const { info } = infos

    infoKey = Object.keys(info)
    infoValue = Object.values(info)
  }

  const handleOpenDialog = (name: string) => {
    if (name === 'viewInvoice') {
      if (ipStatus !== 0) {
        navigate(`/invoice?invoiceId=${invoiceId}`)
      } else {
        b2bPrintInvoice(orderId, 'b2b_print_invoice')
      }
    } else if (name === 'printInvoice') {
      window.open(`/account.php?action=print_invoice&order_id=${orderId}`)
    } else {
      if (!isAgenting && +role === 3) {
        snackbar.error(b3Lang('orderDetail.orderCard.errorMasquerade'))
        return
      }
      setOpen(true)
      setType(name)

      const newDialogData = dialogData.find(
        (data: DialogData) => data.type === name
      )
      setCurrentDialogData(newDialogData)
    }
  }

  let showedInformation: ReactNode[] | string = infoValue?.map(
    (value: string) => (
      <PaymentItemContainer key={value}>{value}</PaymentItemContainer>
    )
  )

  if (typeof infos === 'string') {
    showedInformation = infos
  } else if (infos?.money) {
    showedInformation = infoKey?.map((key: string, index: number) => (
      <Fragment key={key}>
        {key === 'Grand total' && (
          <Divider
            sx={{
              marginBottom: '1rem',
              marginTop: '0.5rem',
            }}
          />
        )}

        <ItemContainer key={key} nameKey={key}>
          <p>{key}</p>
          <p>
            {infos?.money
              ? `${ordersCurrencyFormat(infos.money, infoValue[index])}`
              : currencyFormat(infoValue[index])}
          </p>
        </ItemContainer>
      </Fragment>
    ))
  }

  return (
    <Card
      sx={{
        marginBottom: '1rem',
      }}
    >
      <Box
        sx={{
          padding: '1rem 1rem 0 1rem',
        }}
      >
        <Typography variant="h5">{header}</Typography>
        {subtitle && <div>{subtitle}</div>}
      </Box>
      <CardContent>
        <Box>{showedInformation}</Box>
      </CardContent>
      <StyledCardActions isShowButtons={isShowButtons}>
        {buttons &&
          buttons.map((button: Buttons) => (
            <Fragment key={button.key}>
              {button.isCanShow && (
                <CustomButton
                  value={button.value}
                  key={button.key}
                  name={button.name}
                  variant={button.variant}
                  onClick={throttle(() => {
                    handleOpenDialog(button.name)
                  }, 2000)}
                >
                  {button.value}
                </CustomButton>
              )}
            </Fragment>
          ))}
      </StyledCardActions>

      <OrderDialog
        open={open}
        products={products}
        currentDialogData={currentDialogData}
        type={type}
        setOpen={setOpen}
        itemKey={itemKey}
        orderId={+orderId}
      />
    </Card>
  )
}

interface OrderActionProps {
  detailsData: OrderDetailsState
}

interface OrderData {
  header: string
  key: string
  subtitle: string
  buttons: Buttons[]
  infos: Infos | string
}

export default function OrderAction(props: OrderActionProps) {
  const { detailsData } = props
  const b3Lang = useB3Lang()
  const isB2BUser = useAppSelector(isB2BUserSelector)
  const emailAddress = useAppSelector(
    ({ company }) => company.customer.emailAddress
  )
  const role = useAppSelector(({ company }) => company.customer.role)

  const {
    state: { addressLabelPermission, createdEmail },
  } = useContext(OrderDetailsContext)

  const {
    money,
    orderSummary: { createAt, name, priceData } = {},
    payment: { billingAddress, paymentMethod, dateCreateAt } = {},
    orderComments = '',
    products,
    orderId,
    ipStatus = 0,
    invoiceId,
  } = detailsData

  if (!orderId) {
    return null
  }

  const getCompanyName = (company: string) => {
    if (addressLabelPermission) {
      return company
    }

    const index = company.indexOf('/')

    return company.substring(index + 1, company.length)
  }

  const getFullPaymentAddress = (billingAddress?: Address) => {
    if (!billingAddress) {
      return {}
    }
    const {
      first_name: firstName,
      last_name: lastName,
      company,
      street_1: street1,
      state,
      zip,
      country,
      city,
    } = billingAddress || {}
    const paymentAddress = {
      paymentMethod: b3Lang('orderDetail.paymentMethod', { paymentMethod }),
      name: b3Lang('orderDetail.customerName', { firstName, lastName }),
      company: getCompanyName(company),
      street: street1,
      address: b3Lang('orderDetail.customerAddress', {
        city,
        state,
        zip,
        country,
      }),
    }

    return paymentAddress
  }

  const handleOrderComments = (value: string) => {
    const commentsArr = value.split(/\n/g)

    const comments: {
      [k: string]: string
    } = {}

    const dividingLine = ['-------------------------------------']

    commentsArr.forEach((item, index) => {
      if (item.trim().length > 0) {
        const isHaveTitle = item.trim().includes(':')

        let message = isHaveTitle
          ? item
          : b3Lang('orderDetail.itemComments', { item })
        if (dividingLine.includes(item)) {
          message = item
        }

        comments[`mes${index}`] = message
      }
    })

    return comments
  }

  const buttons: Buttons[] = [
    {
      value: b3Lang('orderDetail.reorder'),
      key: 'Re-Order',
      name: 'reOrder',
      variant: 'outlined',
      isCanShow: +role !== 2,
    },
    {
      value: b3Lang('orderDetail.return'),
      key: 'Return',
      name: 'return',
      variant: 'outlined',
      // isCanShow should be the value of canReturn, obtained from detailsData, but in ticket BUN-1417 was
      // decided to hide it until the return function works as expected.
      // After that it should returned to its original value.
      isCanShow: false,
    },
    {
      value: b3Lang('orderDetail.addToShoppingList'),
      key: 'add-to-shopping-list',
      name: 'shoppingList',
      variant: 'outlined',
      isCanShow: true,
    },
  ]

  const orderData: OrderData[] = [
    {
      header: b3Lang('orderDetail.summary'),
      key: 'order-summary',
      subtitle:
        dateCreateAt && name
          ? b3Lang('orderDetail.purchaseDetails', {
              name,
              updatedAt: displayFormat(+dateCreateAt),
            })
          : '',
      buttons,
      infos: {
        money,
        info: priceData || {},
      },
    },
    {
      header: b3Lang('orderDetail.payment'),
      key: 'payment',
      subtitle: createAt
        ? b3Lang('orderDetail.paidInFull', {
            paidDate: displayFormat(createAt, true),
          })
        : '',
      buttons: [
        {
          value: isB2BUser
            ? b3Lang('orderDetail.viewInvoice')
            : b3Lang('orderDetail.printInvoice'),
          key: 'aboutInvoice',
          name: isB2BUser ? 'viewInvoice' : 'printInvoice',
          variant: 'outlined',
          isCanShow: +ipStatus !== 0 || createdEmail === emailAddress,
        },
      ],
      infos: {
        info: getFullPaymentAddress(billingAddress),
      },
    },
    {
      header: b3Lang('orderDetail.comments'),
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
      {orderData &&
        orderData.map((item: OrderData) => (
          <OrderCard
            products={products!}
            orderId={orderId.toString()}
            {...item}
            itemKey={item.key}
            role={role}
            ipStatus={ipStatus}
            invoiceId={invoiceId}
          />
        ))}
    </OrderActionContainer>
  )
}
