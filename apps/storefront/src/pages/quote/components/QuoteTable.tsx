import { forwardRef, Ref, useImperativeHandle, useRef, useState } from 'react'
import { Delete, Edit } from '@mui/icons-material'
import { Box, styled, TextField, Typography } from '@mui/material'
import { ceil } from 'lodash'

import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { store } from '@/store'
import {
  B3LStorage,
  calculateProductListPrice,
  currencyFormat,
  setModifierQtyPrice,
  snackbar,
} from '@/utils'
import { getProductOptionsFields } from '@/utils/b3Product/shared/config'

import ChooseOptionsDialog from '../../shoppingListDetails/components/ChooseOptionsDialog'

import QuoteTableCard from './QuoteTableCard'

interface ListItem {
  [key: string]: string
}

interface ProductInfoProps {
  basePrice: number | string
  baseSku: string
  createdAt: number
  discount: number | string
  enteredInclusive: boolean
  id: number | string
  itemId: number
  optionList: string
  primaryImage: string
  productId: number
  productName: string
  productUrl: string
  quantity: number | string
  tax: number | string
  updatedAt: number
  variantId: number
  variantSku: string
  productsSearch: CustomFieldItems
}

interface ListItemProps {
  node: ProductInfoProps
}

interface ShoppingDetailTableProps {
  total: number
  getQuoteTableDetails: any
  idEdit?: boolean
  isB2BUser: boolean
  updateSummary: () => void
  updateList: () => void
}

interface SearchProps {
  first?: number
  offset?: number
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void
  setList: (items?: ListItemProps[]) => void
  getSelectedValue: () => void
  refresh: () => void
}

const StyledQuoteTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '0',
  width: '100%',

  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
      },
      '& td: first-of-type': {
        verticalAlign: 'inherit',
      },
    },
    '& tr: hover': {
      '& #shoppingList-actionList': {
        opacity: 1,
      },
    },
  },
}))

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}))

function QuoteTable(props: ShoppingDetailTableProps, ref: Ref<unknown>) {
  const {
    total,
    getQuoteTableDetails,
    idEdit = true,
    isB2BUser,
    updateSummary,
    updateList,
  } = props
  const quoteProductQtyMaxLimit = 1000000

  const {
    global: { enteredInclusive: enteredInclusiveTax },
  } = store.getState()

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<any>(null)
  const [optionsProductId, setOptionsProductId] = useState<number | string>('')
  const [search, setSearch] = useState<SearchProps>({
    first: 12,
    offset: 0,
  })

  const handleUpdateProductQty = async (row: any, value: number | string) => {
    const product = await setModifierQtyPrice(row, +value)

    const listItems = paginationTableRef.current?.getList() || []
    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item
      if (node?.id === (product as CustomFieldItems).id) {
        ;(item as CustomFieldItems).node = product
      }

      return item
    })

    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []

    const index = quoteDraftAllList.findIndex(
      (item: CustomFieldItems) =>
        item.node.id === (product as CustomFieldItems).id
    )

    quoteDraftAllList[index].node = product

    B3LStorage.set('b2bQuoteDraftList', quoteDraftAllList)

    paginationTableRef.current?.setList([...newListItems])
    updateList()
  }

  const handleCheckProductQty = async (row: any, value: number | string) => {
    let newQty = ceil(+value)
    if (newQty === +value && newQty >= 1 && newQty <= quoteProductQtyMaxLimit)
      return

    if (+value < 1) {
      newQty = 1
    }

    if (+value > quoteProductQtyMaxLimit) {
      newQty = quoteProductQtyMaxLimit
    }

    handleUpdateProductQty(row, newQty)
  }

  const handleDeleteClick = (id: number | string) => {
    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []

    const index = quoteDraftAllList.findIndex(
      (item: CustomFieldItems) => item.node.id === id
    )

    quoteDraftAllList.splice(index, 1)

    B3LStorage.set('b2bQuoteDraftList', quoteDraftAllList)

    paginationTableRef.current?.refresh()

    updateSummary()
  }

  useImperativeHandle(ref, () => ({
    getList: () => paginationTableRef.current?.getList(),
    refreshList: () => paginationTableRef.current?.refresh(),
  }))

  const handleChooseOptionsDialogCancel = () => {
    setSelectedOptionsOpen(false)
  }

  const handleOpenProductEdit = (product: any, itemId: number | string) => {
    setOptionsProduct(product)
    setOptionsProductId(itemId)
    setSelectedOptionsOpen(true)
  }

  const getNewQuoteProduct = (products: CustomFieldItems[]) =>
    products.map((product) => {
      const {
        variantId,
        newSelectOptionList,
        id,
        productId,
        name: productName,
        quantity,
        variants = [],
        basePrice,
        taxPrice = 0,
      } = product

      const variantInfo =
        variants.length === 1
          ? variants[0]
          : variants.find(
              (item: CustomFieldItems) => item.variant_id === variantId
            )

      const { image_url: primaryImage = '', sku: variantSku } = variantInfo

      let selectOptions
      try {
        selectOptions = JSON.stringify(newSelectOptionList)
      } catch (error) {
        selectOptions = '[]'
      }

      const taxExclusive = variantInfo.bc_calculated_price.tax_exclusive
      const taxInclusive = variantInfo.bc_calculated_price.tax_inclusive

      const basePriceExclusiveTax = basePrice || taxExclusive

      const tax = taxPrice || +taxInclusive - +taxExclusive

      return {
        node: {
          basePrice: basePriceExclusiveTax,
          taxPrice: tax,
          optionList: selectOptions,
          id,
          primaryImage,
          productId,
          productName,
          productsSearch: {
            ...product,
            selectOptions,
          },
          quantity,
          variantSku,
        },
      }
    })

  const handleChooseOptionsDialogConfirm = async (
    products: CustomFieldItems[]
  ) => {
    await calculateProductListPrice(products)
    const newProducts = getNewQuoteProduct(products)

    newProducts.forEach((product: CustomFieldItems) => {
      const {
        variantSku,
        productsSearch: { variants },
        basePrice,
      } = product.node
      const variantItem = variants.find(
        (item: CustomFieldItems) => item.sku === variantSku
      )

      product.node.id = optionsProductId

      product.node.basePrice = basePrice
      product.node.tax =
        variantItem.bc_calculated_price.tax_inclusive -
        variantItem.bc_calculated_price.tax_exclusive
    })

    setSelectedOptionsOpen(false)

    const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []

    b2bQuoteDraftList.forEach((item: CustomFieldItems) => {
      if (item.node.id === optionsProductId) {
        item.node = newProducts[0]?.node || {}
      }
    })

    B3LStorage.set('b2bQuoteDraftList', b2bQuoteDraftList)

    updateList()

    setSearch({
      offset: 0,
    })

    snackbar.success('Product were updated in your quote.')
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const product: any = {
          ...row.productsSearch,
          selectOptions: row.optionList,
        }
        const productFields = getProductOptionsFields(product, {})

        const optionList = JSON.parse(row.optionList)
        const optionsValue: CustomFieldItems[] = productFields.filter(
          (item) => item.valueText
        )

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.primaryImage || PRODUCT_DEFAULT_IMAGE}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography
                variant="body1"
                color="#212121"
                onClick={() => {
                  const {
                    location: { origin },
                  } = window

                  if (product?.productUrl) {
                    window.location.href = `${origin}${product?.productUrl}`
                  }
                }}
                sx={{
                  cursor: 'pointer',
                }}
              >
                {row.productName}
              </Typography>
              <Typography variant="body1" color="#616161">
                {row.variantSku}
              </Typography>
              {optionList.length > 0 && optionsValue.length > 0 && (
                <Box>
                  {optionsValue.map((option: any) => (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        color: '#455A64',
                      }}
                      key={option.valueLabel}
                    >
                      {`${option.valueLabel}: ${option.valueText}`}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )
      },
      width: '40%',
    },
    {
      key: 'Price',
      title: 'Price',
      render: (row: CustomFieldItems) => {
        const { basePrice, taxPrice } = row

        const inTaxPrice = enteredInclusiveTax
          ? +basePrice
          : +basePrice + +taxPrice

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${currencyFormat(inTaxPrice)}`}
          </Typography>
        )
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Qty',
      title: 'Qty',
      render: (row) => (
        <StyledTextField
          size="small"
          type="number"
          variant="filled"
          disabled={!idEdit}
          value={row.quantity}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(e) => {
            handleUpdateProductQty(row, +e.target.value)
          }}
          onBlur={(e) => {
            handleCheckProductQty(row, +e.target.value)
          }}
          sx={{
            width: '75%',
          }}
        />
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Total',
      title: 'Total',
      render: (row: CustomFieldItems) => {
        const { basePrice, quantity, taxPrice } = row
        const inTaxPrice = enteredInclusiveTax
          ? +basePrice
          : +basePrice + +taxPrice
        const total = inTaxPrice * +quantity
        const optionList = JSON.parse(row.optionList)

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {`${currencyFormat(total)}`}
            </Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: 'end',
              }}
              id="shoppingList-actionList"
            >
              {optionList.length > 0 && idEdit && (
                <Edit
                  sx={{
                    marginRight: '0.5rem',
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    const { productsSearch, id, optionList, quantity } = row

                    handleOpenProductEdit(
                      {
                        ...productsSearch,
                        quantity,
                        selectOptions: optionList,
                      },
                      id
                    )
                  }}
                />
              )}
              {idEdit && (
                <Delete
                  sx={{
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    const { id } = row
                    handleDeleteClick(id)
                  }}
                />
              )}
            </Box>
          </Box>
        )
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
  ]

  return (
    <StyledQuoteTableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0.5rem 16px 1rem',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {`${total || 0} products`}
        </Typography>
      </Box>

      <B3PaginationTable
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[12, 24, 36]}
        getRequestList={getQuoteTableDetails}
        isCustomRender={false}
        hover
        searchParams={search}
        labelRowsPerPage="Per page:"
        showBorder={false}
        itemIsMobileSpacing={0}
        noDataText="No products found"
        renderItem={(row: ProductInfoProps, index?: number) => (
          <QuoteTableCard
            len={total || 0}
            item={row}
            itemIndex={index}
            onEdit={handleOpenProductEdit}
            onDelete={handleDeleteClick}
            handleUpdateProductQty={handleUpdateProductQty}
            idEdit={idEdit}
          />
        )}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isRequestLoading}
        setIsLoading={setIsRequestLoading}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        isEdit
        isB2BUser={isB2BUser}
      />
    </StyledQuoteTableContainer>
  )
}

export default forwardRef(QuoteTable)
