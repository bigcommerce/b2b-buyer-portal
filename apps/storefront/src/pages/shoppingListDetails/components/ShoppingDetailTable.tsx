import {
  useState,
  ReactElement,
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
  updateB2BShoppingListsItem,
} from '@/shared/service/b2b'

import {
  snackbar,
} from '@/utils'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import {
  useMobile,
} from '@/hooks'

import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import {
  ChooseOptionsDialog,
} from './ChooseOptionsDialog'

import ShoppingDetailCard from './ShoppingDetailCard'
import {
  ShoppingListAddProductItem,
} from '../../../types'

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
  shoppingListInfo: any,
  currencyToken: string,
  setIsRequestLoading: (value: boolean) => void,
  shoppingListId: number | string,
  getShoppingListDetails: any,
  handleDeleteItems: (itemId: number | string) => void,
  setCheckedArr: (values: any) => void,
  isReadForApprove: boolean,
}

interface SearchProps {
  search: string,
  first?: number,
  offset?: number,
}

const StyledShoppingListTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '0.5rem',

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

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

const ShoppingDetailTable = (props: ShoppingDetailTableProps, ref: Ref<unknown>) => {
  const [isMobile] = useMobile()

  const {
    shoppingListInfo,
    currencyToken,
    setIsRequestLoading,
    shoppingListId,
    getShoppingListDetails,
    handleDeleteItems,
    setCheckedArr,
    isReadForApprove,
  } = props

  const paginationTableRef = useRef<any>(null)

  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<any>(null)
  const [editProductItemId, setEditProductItemId] = useState<number | string | null>(null)
  const [search, setSearch] = useState<SearchProps>({
    search: '',
  })

  const handleUpdateProductQty = (id: number | string, value: number | string) => {
    const listItems = paginationTableRef.current.getList()
    const newListItems = listItems?.map((item: ListItemProps) => {
      const {
        node,
      } = item
      if (node?.id === id) {
        node.quantity = +value || ''
      }

      return item
    })

    paginationTableRef.current.setList([...newListItems])
  }

  const initSearch = () => {
    setSearch({
      search: '',
    })
  }

  useImperativeHandle(ref, () => ({
    initSearch,
    getList: () => paginationTableRef.current.getList(),
    setList: () => paginationTableRef.current.setList(),
    getSelectedValue: () => paginationTableRef.current.getSelectedValue(),
  }))

  const handleSearchProduct = async (q: string) => {
    setSearch({
      search: q,
    })
  }

  const handleChooseOptionsDialogCancel = () => {
    setEditProductItemId('')
    setSelectedOptionsOpen(false)
  }

  const handleOpenProductEdit = (product: any, variantId: number | string, itemId: number | string) => {
    setEditProductItemId(itemId)
    setOptionsProduct(product)
    setSelectedOptionsOpen(true)
  }

  const handleChooseOptionsDialogConfirm = async (products: ShoppingListAddProductItem[]) => {
    setIsRequestLoading(true)
    try {
      const data = {
        itemId: editProductItemId,
        shoppingListId,
        itemData: {
          variantId: products[0].variantId,
          quantity: products[0].quantity,
          optionList: products[0].optionList || [],
        },
      }

      await updateB2BShoppingListsItem(data)
      setSelectedOptionsOpen(false)
      setEditProductItemId('')
      snackbar.success('Product updated successfully')
      initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleUpdateShoppingListItem = async (itemId: number | string) => {
    setIsRequestLoading(true)
    const listItems = paginationTableRef.current.getList()
    const currentItem = listItems.find((item: any) => {
      const {
        node,
      } = item

      return node.itemId === itemId
    })
    let currentNode

    if (currentItem) {
      currentNode = currentItem.node
    }

    const options = JSON.parse(currentNode?.optionList || '[]')

    const optionsList = options.map((option: {
      option_id: number | string,
      option_value: number| string,
    }) => ({
      optionId: option.option_id,
      optionValue: option.option_value,
    }))

    const itemData = {
      variantId: currentNode?.variantId,
      quantity: currentNode?.quantity,
      optionList: optionsList || [],
    }

    try {
      const data = {
        itemId,
        shoppingListId,
        itemData,
      }

      await updateB2BShoppingListsItem(data)

      initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current.getList()
      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: any) => {
          const {
            node,
          } = product

          return node.id === item
        })

        console.log(newItems)

        return newItems
      })
      console.log(checkedItems, 'checkedItems')

      setCheckedArr([...checkedItems])
    } else {
      setCheckedArr([])
    }
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const optionList = JSON.parse(row.optionList)
        let optionsValue
        if (optionList.length > 0) {
          const {
            productsSearch: {
              variants,
            },
          } = row

          const variant = variants.find((item: any) => +item.variant_id
          === +row.variantId || +item.id === +row.variantId)

          optionsValue = variant?.option_values || []
        }

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.primaryImage || defaultProductImage}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography>{row.productName}</Typography>
              <Typography>{row.variantSku}</Typography>
              {
                (optionList.length > 0 && optionsValue.length > 0) && (
                  <Box>
                    {
                      optionsValue.map((option: any) => (
                        <Typography key={option.option_display_name}>
                          {`${option.option_display_name
                          }: ${option.label}`}
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
      render: (row) => {
        const price = +row.basePrice

        return (
          <Box>{`${currencyToken}${price.toFixed(2)}`}</Box>
        )
      },
      width: '15%',
    },
    {
      key: 'Qty',
      title: 'Qty',
      render: (row) => (
        <TextField
          size="small"
          type="number"
          disabled={isReadForApprove}
          value={row.quantity}
          onChange={(e) => {
            handleUpdateProductQty(row.id, e.target.value)
          }}
          onBlur={() => {
            handleUpdateShoppingListItem(row.itemId)
          }}
        />
      ),
      width: '15%',
    },
    {
      key: 'Total',
      title: 'Total',
      render: (row) => {
        const {
          basePrice,
          quantity,
          itemId,
        } = row
        const total = +basePrice * +quantity
        const optionList = JSON.parse(row.optionList)

        return (
          <Box>
            <Typography>{`${currencyToken}${total.toFixed(2)}`}</Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: isMobile ? 'end' : 'start',
              }}
              id="shoppingList-actionList"
            >
              {
                optionList.length > 0 && !isReadForApprove && (
                  <Edit
                    sx={{
                      marginRight: '0.5rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const {
                        productsSearch,
                        variantId,
                        itemId,
                      } = row

                      handleOpenProductEdit(productsSearch, variantId, itemId)
                    }}
                  />
                )
              }
              {
                !isReadForApprove && (
                <Delete
                  sx={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleDeleteItems(+itemId)
                  }}
                />
                )
              }

            </Box>
          </Box>
        )
      },
      width: '20%',
    },
  ]

  return (
    <StyledShoppingListTableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0.5rem 0 1rem 0',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {`${shoppingListInfo?.products?.totalCount || 0} products`}
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {`${currencyToken}${shoppingListInfo?.grandTotal || 0.00}`}
        </Typography>
      </Box>
      <Box
        sx={{
          marginBottom: '5px',
        }}
      >
        <B3FilterSearch
          handleChange={(e) => {
            handleSearchProduct(e)
          }}
        />
      </Box>

      <B3PaginationTable
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[10, 20, 50]}
        getRequestList={getShoppingListDetails}
        searchParams={search}
        isCustomRender={false}
        showCheckbox
        showBorder={false}
        requestLoading={setIsRequestLoading}
        getSelectCheckbox={getSelectCheckbox}
        renderItem={(row: any, index?: number, checkBox?: () => ReactElement) => (
          <ShoppingDetailCard
            item={row}
            onEdit={handleOpenProductEdit}
            onDelete={handleDeleteItems}
            checkBox={checkBox}
            currencyToken={currencyToken}
            handleUpdateProductQty={handleUpdateProductQty}
            handleUpdateShoppingListItem={handleUpdateShoppingListItem}
          />
        )}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        currency={currencyToken}
      />

    </StyledShoppingListTableContainer>
  )
}

export default forwardRef(ShoppingDetailTable)
