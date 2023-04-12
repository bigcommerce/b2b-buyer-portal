import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  Ref,
} from 'react'

import {
  Box,
  styled,
  Typography,
  TextField,
} from '@mui/material'

import {
  Delete,
  Edit,
} from '@mui/icons-material'

import {
  B3LStorage,
  getModifiersPrice,
  getQuickAddProductExtraPrice,
  snackbar,
} from '@/utils'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import QuoteTableCard from './QuoteTableCard'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  ChooseOptionsDialog,
} from '../../shoppingListDetails/components/ChooseOptionsDialog'

import {
  getProductOptionsFields,
} from '../../shoppingListDetails/shared/config'

interface ListItem {
  [key: string]: string
}

interface ProductInfoProps {
  basePrice: number | string,
  baseSku: string,
  createdAt: number,
  discount: number | string,
  enteredInclusive: boolean,
  id: number | string,
  itemId: number,
  optionList: string,
  primaryImage: string,
  productId: number,
  productName: string,
  productUrl: string,
  quantity: number | string,
  tax: number | string,
  updatedAt: number,
  variantId: number,
  variantSku: string,
  productsSearch: CustomFieldItems,
}

interface ListItemProps {
  node: ProductInfoProps,
}

interface ShoppingDetailTableProps {
  total: number,
  currencyToken?: string,
  getQuoteTableDetails: any,
  idEdit?: boolean,
  isB2BUser: boolean,
  updateSummary: () => void,
  customColor: string,
}

interface SearchProps {
  first?: number,
  offset?: number,
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void,
  setList: (items?: ListItemProps[]) => void,
  getSelectedValue: () => void,
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

const QuoteTable = (props: ShoppingDetailTableProps, ref: Ref<unknown>) => {
  const {
    total,
    currencyToken,
    getQuoteTableDetails,
    idEdit = true,
    isB2BUser,
    updateSummary,
    customColor,
  } = props

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<any>(null)
  const [optionsProductId, setOptionsProductId] = useState<number | string>('')
  const [search, setSearch] = useState<SearchProps>({
    first: 12,
    offset: 0,
  })

  const handleUpdateProductQty = (id: number | string, value: number | string) => {
    const listItems = paginationTableRef.current?.getList() || []
    const newListItems = listItems?.map((item: ListItemProps) => {
      const {
        node,
      } = item
      if (node?.id === id) {
        node.quantity = +value || ''
      }

      return item
    })

    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []

    const index = quoteDraftAllList.findIndex((item: CustomFieldItems) => item.node.id === id)

    quoteDraftAllList[index].node.quantity = +value

    B3LStorage.set('b2bQuoteDraftList', quoteDraftAllList)

    paginationTableRef.current?.setList([...newListItems])
    updateSummary()
  }

  const handleDeleteClick = (id: number | string) => {
    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []

    const index = quoteDraftAllList.findIndex((item: CustomFieldItems) => item.node.id === id)

    quoteDraftAllList.splice(index, 1)

    B3LStorage.set('b2bQuoteDraftList', quoteDraftAllList)

    setSearch({
      offset: 0,
    })

    updateSummary()
  }

  useImperativeHandle(ref, () => ({
    getList: () => paginationTableRef.current?.getList(),
    refreshList: () => {
      setSearch({
        offset: 0,
      })
    },
  }))

  const handleChooseOptionsDialogCancel = () => {
    setSelectedOptionsOpen(false)
  }

  const handleOpenProductEdit = (product: any, itemId: number | string) => {
    setOptionsProduct(product)
    setOptionsProductId(itemId)
    setSelectedOptionsOpen(true)
  }

  const getNewQuoteProduct = (products: CustomFieldItems[]) => products.map((product) => {
    const {
      variantId,
      newSelectOptionList,
      id: productId,
      name: productName,
      quantity,
      variants = [],
      allOptions,
      additionalProducts,
    } = product

    const modifiersPrice = getModifiersPrice(allOptions || [], newSelectOptionList)

    const productExtraPrice = getQuickAddProductExtraPrice(allOptions || [], newSelectOptionList, additionalProducts)

    const additionalCalculatedPrices = [...modifiersPrice, ...productExtraPrice]

    const variantInfo = variants.length === 1 ? variants[0] : variants.find((item: CustomFieldItems) => item.variant_id === variantId)

    const {
      image_url: primaryImage = '',
      calculated_price: basePrice,
      sku: variantSku,
    } = variantInfo

    let selectOptions
    try {
      selectOptions = JSON.stringify(newSelectOptionList)
    } catch (error) {
      selectOptions = '[]'
    }

    return {
      node: {
        basePrice: basePrice.toFixed(2),
        additionalCalculatedPrices,
        optionList: selectOptions,
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

  const handleChooseOptionsDialogConfirm = async (products: CustomFieldItems[]) => {
    const productsss = getNewQuoteProduct(products)

    productsss.forEach((product: CustomFieldItems) => {
      const {
        variantSku,
        productsSearch: {
          variants,
        },
        basePrice,
      } = product.node
      const variantItem = variants.find((item: CustomFieldItems) => item.sku === variantSku)

      product.node.id = optionsProductId

      product.node.basePrice = basePrice
      product.node.tax = variantItem.bc_calculated_price.tax_inclusive - variantItem.bc_calculated_price.tax_exclusive
    })

    setSelectedOptionsOpen(false)

    const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []

    b2bQuoteDraftList.forEach((item: CustomFieldItems) => {
      if (item.node.id === optionsProductId) {
        item.node = productsss[0]?.node || {}
      }
    })

    B3LStorage.set('b2bQuoteDraftList', b2bQuoteDraftList)

    updateSummary()

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
        const productFields = (getProductOptionsFields(product, {}))

        const optionList = JSON.parse(row.optionList)
        const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText)

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
              >
                {row.productName}
              </Typography>
              <Typography
                variant="body1"
                color="#616161"
              >
                {row.variantSku}
              </Typography>
              {
                (optionList.length > 0 && optionsValue.length > 0) && (
                  <Box>
                    {
                      optionsValue.map((option: any) => (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            color: '#455A64',
                          }}
                          key={option.valueLabel}
                        >
                          {`${option.valueLabel
                          }: ${option.valueText}`}
                        </Typography>
                      ))
                    }
                  </Box>
                )
              }
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
        const {
          productsSearch: {
            variants,
          },
          variantId,
          variantSku,
        } = row

        const currentVariantInfo = variants.find((item: CustomFieldItems) => +item.variant_id === +variantId || variantSku === item.sku) || {}
        const bcCalculatedPrice: {
          tax_inclusive: number | string,
        } = currentVariantInfo.bc_calculated_price
        // const price = +row.basePrice
        const withTaxPrice = +bcCalculatedPrice.tax_inclusive

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${currencyToken}${withTaxPrice.toFixed(2)}`}
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
            inputMode: 'numeric', pattern: '[0-9]*',
          }}
          sx={{
            '& .MuiFilledInput-root:after': {
              borderBottom: `2px solid ${customColor || '#1976d2'}`,
            },
          }}
          onChange={(e) => {
            handleUpdateProductQty(row.id, e.target.value)
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
        const {
          // basePrice,
          quantity,
          productsSearch: {
            variants,
          },
          variantId,
          variantSku,
        } = row
        const currentVariantInfo = variants.find((item: CustomFieldItems) => +item.variant_id === +variantId || variantSku === item.sku) || {}
        const bcCalculatedPrice: {
          tax_inclusive: number | string,
        } = currentVariantInfo.bc_calculated_price

        const withTaxPrice = +bcCalculatedPrice.tax_inclusive
        const total = +withTaxPrice * +quantity
        const optionList = JSON.parse(row.optionList)

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {`${currencyToken}${total.toFixed(2)}`}
            </Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: 'end',
              }}
              id="shoppingList-actionList"
            >
              {
                optionList.length > 0 && idEdit && (
                  <Edit
                    sx={{
                      marginRight: '0.5rem',
                      cursor: 'pointer',
                      color: 'rgba(0, 0, 0, 0.54)',
                    }}
                    onClick={() => {
                      const {
                        productsSearch,
                        id,
                        optionList,
                        quantity,
                      } = row

                      handleOpenProductEdit({
                        ...productsSearch,
                        quantity,
                        selectOptions: optionList,
                      }, id)
                    }}
                  />
                )
              }
              {
                idEdit && (
                <Delete
                  sx={{
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    const {
                      id,
                    } = row
                    handleDeleteClick(id)
                  }}
                />
                )
              }

            </Box>
          </Box>
        )
      },
      width: '20%',
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
            currencyToken={currencyToken || '$'}
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
        currency={currencyToken}
        isEdit
        isB2BUser={isB2BUser}
      />

    </StyledQuoteTableContainer>
  )
}

export default forwardRef(QuoteTable)
