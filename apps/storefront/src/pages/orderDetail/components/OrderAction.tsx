import {
  useState,
  useEffect,
  useContext,
  JSXElementConstructor,
  ReactElement,
  ReactFragment,
  ReactPortal,
  MouseEvent,
} from 'react'

import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Input,
} from '@mui/material'
import styled from '@emotion/styled'

import {
  format,
} from 'date-fns'

import {
  TableColumnItem,
} from '@/components/B3Table'

import {
  OrderDialog,
} from './OrderDialog'

const OrderActionContainer = styled('div')(() => ({

}))
const Test = styled('div')(() => ({
  minWidth: '100%',
  minHeight: '300px',
}))

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
  fontWeight: props.nameKey === 'GrandTotal' ? 700 : 400,

  '& p': {
    marginTop: 0,
  },
}))

const StyledCurrency = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '40%',
  justifyContent: 'space-between',

  // '& p': {
  //   marginLeft: '1rem',
  // },
}))

// const Subtitle = styled('p')(() => ({

// }))

const OrderCard = (props: any) => {
  const {
    header,
    subtitle,
    buttons,
    infos,
    products,
    itemKey,
  } = props

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
  const [title, setTitle] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [currentDialogData, setCurrentDialogData] = useState<any>({})

  // const [infoKey, setInfoKey] = useState<string[]>([])
  // const [infoValue, setInfoValue] = useState<string[]>([])
  let infoKey
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
      value,
    } = e.target

    if (name === 'viewInvoice') {
      // TODO
    } else if (name === 'return') {
      // TODO
    } else {
      setOpen(true)
      setTitle(value)
      setType(name)

      const newDialogData = dialogData.find((data: any) => data.type === name)
      setCurrentDialogData(newDialogData)
    }
  }

  const handleConfirm = () => {
    // TODO
  }

  const columnItems: TableColumnItem<any>[] = [
    {
      key: 'product',
      title: 'Product',
      render: (item: any) => <p>产品信息</p>,
      width: '40%',
    },
    {
      key: 'price',
      title: 'Price',
      render: (item: any) => <p>{item.price}</p>,
    },
    {
      key: 'qty',
      title: 'Q-ty',
      render: (item: any) => (
        <Input
          type="number"
          value={item.qty}
        />
      ),
    },
    {
      key: 'cost',
      title: 'Cost',
      render: (item: any) => <p>{item.cost}</p>,
    },
  ]
  const listItems = [
    {
      price: 12,
      const: 11,
      qty: 5,
      name: 'test1',
      sku: 'TD-001',
    },
    {
      price: 13,
      const: 12,
      qty: 6,
      name: 'test2',
      sku: 'TD-002',
    },
    {
      price: 14,
      const: 13,
      qty: 7,
      name: 'test3',
      sku: 'TD-003',
    },
  ]

  return (
    <Card
      sx={{
        // minHeight: '300px',
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
                    infoKey && infoKey.map((key, index) => (
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
                    infoValue && infoValue.map((value: any) => (
                      <ItemContainer key={value}>
                        {value}
                      </ItemContainer>
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
            <Button
              {...button}
              onClick={(e) => { handleOpenDialog(e) }}
            >
              {button.value}
            </Button>
          ))
        }
      </StyledCardActions>

      <OrderDialog
        title={title}
        open={open}
        columnItems={columnItems}
        listItems={listItems}
        products={products}
        currentDialogData={currentDialogData}
        type={type}
        setOpen={setOpen}
        handleConfirm={handleConfirm}
        itemKey={itemKey}
      />
    </Card>
  )
}

export const OrderAction = (props: any) => {
  const {
    detailsData,
  } = props

  const {
    money,
    orderSummary,
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
    } = billingAddress
    const paymentAddress = {
      paymentMethod: `Payment by ${paymentMethod}`,
      name: `${firstName} ${lastName}`,
      company,
      address: `${street1}, ${state} ${zip}, ${country}`,
    }

    return paymentAddress
  }

  const handleOrderComments = (value: string) => {
    // const comments = value.replace(/\n/g, '<br/>')
    const commentsArr = value.split(/\n/g)
    const comments: any = {}

    commentsArr.forEach((item, index) => {
      if (item.trim().length > 0) {
        comments[`mes${index}`] = item
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
      // onClick: () => handleTest(),
    },
    {
      value: 'Return',
      key: 'Return',
      name: 'return',
      variant: 'outlined',
    },
    {
      value: 'ADD TO SHOPPING LIST',
      key: 'add-to-shipping-list',
      name: 'shippingList',
      variant: 'outlined',
    },
  ]

  const orderData = [
    {
      header: 'Order summary',
      key: 'order-summary',
      // subtitle: 'Purchased by John Miles on 13 Oct 22.',
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
          value: 'view invoice',
          key: 'viewInvoice',
          name: 'viewInvoice',
          variant: 'outlined',
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
            {...item}
            itemKey={item.key}
          />
        ))
      }
    </OrderActionContainer>
  )
}
