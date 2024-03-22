import {
  Dispatch,
  forwardRef,
  ReactElement,
  Ref,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useB3Lang } from '@b3/lang'
import { Delete, Edit, StickyNote2 } from '@mui/icons-material'
import { Box, Grid, styled, TextField, Typography } from '@mui/material'
import cloneDeep from 'lodash-es/cloneDeep'

import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useMobile, useSort } from '@/hooks'
import {
  updateB2BShoppingListsItem,
  updateBcShoppingListsItem,
} from '@/shared/service/b2b'
import { store } from '@/store'
import { currencyFormat, getValidOptionsList, snackbar } from '@/utils'
import { getBCPrice, getDisplayPrice } from '@/utils/b3Product/b3Product'
import { getProductOptionsFields } from '@/utils/b3Product/shared/config'

import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import ChooseOptionsDialog from './ChooseOptionsDialog'
import ShoppingDetailAddNotes from './ShoppingDetailAddNotes'
import ShoppingDetailCard from './ShoppingDetailCard'

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
  productNote: string
  disableCurrentCheckbox?: boolean
}

interface ListItemProps {
  node: ProductInfoProps
}

interface ShoppingDetailTableProps {
  shoppingListInfo: any
  isRequestLoading: boolean
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>
  shoppingListId: number | string
  getShoppingListDetails: CustomFieldItems
  setCheckedArr: (values: CustomFieldItems) => void
  isReadForApprove: boolean
  isJuniorApprove: boolean
  allowJuniorPlaceOrder: boolean
  setDeleteItemId: (itemId: number | string) => void
  setDeleteOpen: (open: boolean) => void
  isB2BUser: boolean
  productQuoteEnabled: boolean
  role: number | string
}

interface SearchProps {
  search: string
  first?: number
  offset?: number
  orderBy: string
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void
  setList: (items?: ListItemProps[]) => void
  getSelectedValue: () => void
  refresh: () => void
}

const StyledShoppingListTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '1rem',
  borderRadius: '4px',
  boxShadow:
    '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',

  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
      },
      '& td: first-of-type': {
        paddingTop: '25px',
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

const defaultSortKey = 'updatedAt'

const sortKeys = {
  Product: 'productName',
  updatedAt: 'updatedAt',
  Qty: 'quantity',
}

function ShoppingDetailTable(
  props: ShoppingDetailTableProps,
  ref: Ref<unknown>
) {
  const [isMobile] = useMobile()
  const b3Lang = useB3Lang()

  const {
    shoppingListInfo,
    isRequestLoading,
    setIsRequestLoading,
    shoppingListId,
    getShoppingListDetails,
    setCheckedArr,
    isReadForApprove,
    setDeleteItemId,
    setDeleteOpen,
    isJuniorApprove,
    isB2BUser,
    allowJuniorPlaceOrder,
    productQuoteEnabled,
    role,
  } = props

  const {
    global: { showInclusiveTaxPrice },
  } = store.getState()

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<any>(null)
  const [editProductItemId, setEditProductItemId] = useState<
    number | string | null
  >(null)
  const [search, setSearch] = useState<SearchProps | {}>({
    orderBy: `-${sortKeys[defaultSortKey]}`,
  })
  const [qtyNotChangeFlag, setQtyNotChangeFlag] = useState<boolean>(true)
  const [originProducts, setOriginProducts] = useState<ListItemProps[]>([])
  const [shoppingListTotalPrice, setShoppingListTotalPrice] =
    useState<number>(0.0)

  const [addNoteOpen, setAddNoteOpen] = useState<boolean>(false)
  const [addNoteItemId, setAddNoteItemId] = useState<number | string>('')
  const [notes, setNotes] = useState<string>('')
  const [disabledSelectAll, setDisabledSelectAll] = useState<boolean>(false)

  const [priceHidden, setPriceHidden] = useState<boolean>(false)

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortKeys,
    defaultSortKey,
    search,
    setSearch
  )

  const handleUpdateProductQty = (
    id: number | string,
    value: number | string
  ) => {
    if (+value < 0) return
    const currentItem = originProducts.find((item: ListItemProps) => {
      const { node } = item

      return node.id === id
    })

    const currentQty = currentItem?.node?.quantity || ''
    setQtyNotChangeFlag(+currentQty === +value)

    const listItems: ListItemProps[] =
      paginationTableRef.current?.getList() || []
    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item
      if (node?.id === id) {
        node.quantity = `${+value}`
        node.disableCurrentCheckbox = +value === 0
      }

      return item
    })

    const nonNumberProducts = newListItems.filter(
      (item: ListItemProps) => +item.node.quantity === 0
    )
    setDisabledSelectAll(nonNumberProducts.length === newListItems.length)
    paginationTableRef.current?.setList([...newListItems])
  }

  const initSearch = () => {
    paginationTableRef.current?.refresh()
  }

  useImperativeHandle(ref, () => ({
    initSearch,
    getList: () => paginationTableRef.current?.getList(),
    setList: () => paginationTableRef.current?.setList(),
    getSelectedValue: () => paginationTableRef.current?.getSelectedValue(),
  }))

  const handleSearchProduct = async (q: string) => {
    setSearch({
      ...search,
      search: q,
    })
  }

  const handleChooseOptionsDialogCancel = () => {
    setEditProductItemId('')
    setSelectedOptionsOpen(false)
  }

  const handleOpenProductEdit = (
    product: any,
    variantId: number | string,
    itemId: number | string
  ) => {
    setEditProductItemId(itemId)
    setOptionsProduct(product)
    setSelectedOptionsOpen(true)
  }

  const handleChooseOptionsDialogConfirm = async (
    products: CustomFieldItems[]
  ) => {
    setIsRequestLoading(true)
    const updateShoppingListItem = isB2BUser
      ? updateB2BShoppingListsItem
      : updateBcShoppingListsItem
    try {
      const newOptionLists = getValidOptionsList(
        products[0].newSelectOptionList,
        products[0]
      )
      const data = {
        itemId: editProductItemId,
        shoppingListId,
        itemData: {
          variantId: products[0].variantId,
          quantity: products[0].quantity,
          optionList: newOptionLists || [],
        },
      }

      await updateShoppingListItem(data)
      setSelectedOptionsOpen(false)
      setEditProductItemId('')
      snackbar.success(b3Lang('shoppingList.table.productUpdated'))
      initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleUpdateShoppingListItem = async (itemId: number | string) => {
    const listItems: ListItemProps[] =
      paginationTableRef.current?.getList() || []
    const currentItem = listItems.find((item: ListItemProps) => {
      const { node } = item

      return node.itemId === itemId
    })
    let currentNode

    if (currentItem) {
      currentNode = currentItem.node
    }

    const options = JSON.parse(currentNode?.optionList || '[]')

    const optionsList = options.map(
      (option: {
        option_id: number | string
        option_value: number | string
      }) => ({
        optionId: option.option_id,
        optionValue: option.option_value,
      })
    )

    const itemData: CustomFieldItems = {
      variantId: currentNode?.variantId,
      quantity: currentNode?.quantity ? +currentNode.quantity : 0,
      optionList: optionsList || [],
      productNote: notes,
    }

    const data = {
      itemId,
      shoppingListId,
      itemData,
    }

    const updateShoppingListItem = isB2BUser
      ? updateB2BShoppingListsItem
      : updateBcShoppingListsItem

    await updateShoppingListItem(data)
  }

  const handleUpdateShoppingListItemQty = async (itemId: number | string) => {
    if (qtyNotChangeFlag) return
    setIsRequestLoading(true)
    try {
      await handleUpdateShoppingListItem(itemId)
      snackbar.success(b3Lang('shoppingList.table.quantityUpdated'))
      setQtyNotChangeFlag(true)
      initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getList() || []
      const checkedItems: CustomFieldItems[] = []
      selectCheckbox.forEach((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const { node } = product

          return node.id === item
        })

        if (newItems) checkedItems.push(newItems)
      })

      setCheckedArr([...checkedItems])
    } else {
      setCheckedArr([])
    }
  }

  const handleCancelAddNotesClick = () => {
    setAddNoteOpen(false)
    setAddNoteItemId('')
    setNotes('')
  }

  const handleAddItemNotesClick = async () => {
    setIsRequestLoading(true)
    try {
      handleCancelAddNotesClick()
      await handleUpdateShoppingListItem(addNoteItemId)
      snackbar.success(b3Lang('shoppingList.table.productNotesUpdated'))
      initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  useEffect(() => {
    if (shoppingListInfo) {
      const {
        products: { edges },
        grandTotal,
        totalTax,
      } = shoppingListInfo

      const NewShoppingListTotalPrice = showInclusiveTaxPrice
        ? +grandTotal
        : +grandTotal - +totalTax || 0.0

      const isPriceHidden = edges.some((item: CustomFieldItems) => {
        if (item?.node?.productsSearch) {
          return item.node.productsSearch?.isPriceHidden || false
        }

        return false
      })

      setPriceHidden(isPriceHidden)
      setOriginProducts(cloneDeep(edges))
      setShoppingListTotalPrice(NewShoppingListTotalPrice)
    }
  }, [shoppingListInfo, showInclusiveTaxPrice])

  useEffect(() => {
    if (shoppingListInfo) {
      const {
        products: { edges },
      } = shoppingListInfo
      const nonNumberProducts = edges.filter(
        (item: ListItemProps) => item.node.quantity === 0
      )
      setDisabledSelectAll(nonNumberProducts.length === edges.length)
    }
  }, [shoppingListInfo])

  const showPrice = (price: string, row: CustomFieldItems): string | number => {
    const {
      productsSearch: { isPriceHidden },
    } = row
    if (isPriceHidden) return ''
    return getDisplayPrice({
      price,
      productInfo: row,
      showText: isPriceHidden ? '' : price,
      forcedSkip: true,
    })
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: b3Lang('shoppingList.table.product'),
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

                  window.location.href = `${origin}${row.productUrl}`
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

              {row?.productNote && row?.productNote.trim().length > 0 && (
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: '#ED6C02',
                    marginTop: '0.3rem',
                  }}
                >
                  {row.productNote}
                </Typography>
              )}
            </Box>
          </Box>
        )
      },
      width: '45%',
      isSortable: true,
    },
    {
      key: 'Price',
      title: b3Lang('shoppingList.table.price'),
      render: (row: CustomFieldItems) => {
        const { basePrice, taxPrice = 0 } = row
        const inTaxPrice = getBCPrice(+basePrice, +taxPrice)

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {showPrice(currencyFormat(inTaxPrice), row)}
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
      title: b3Lang('shoppingList.table.quantity'),
      render: (row) => (
        <StyledTextField
          size="small"
          type="number"
          variant="filled"
          sx={{
            width: '72px',
          }}
          disabled={isReadForApprove || isJuniorApprove}
          value={row.quantity}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(e) => {
            handleUpdateProductQty(row.id, e.target.value)
          }}
          onBlur={() => {
            handleUpdateShoppingListItemQty(row.itemId)
          }}
        />
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
      isSortable: true,
    },
    {
      key: 'Total',
      title: b3Lang('shoppingList.table.total'),
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          quantity,
          itemId,
          productsSearch: { options },
          taxPrice = 0,
        } = row

        const inTaxPrice = getBCPrice(+basePrice, +taxPrice)

        const totalPrice = inTaxPrice * +quantity

        const optionList = options || JSON.parse(row.optionList)

        const canChangeOption =
          optionList.length > 0 && !isReadForApprove && !isJuniorApprove

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {showPrice(currencyFormat(totalPrice), row)}
            </Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: isMobile ? 'end' : 'start',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
              id="shoppingList-actionList"
            >
              <Grid
                item
                sx={{
                  marginRight: '0.5rem',
                  minWidth: '32px',
                }}
              >
                <StickyNote2
                  sx={{
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    setAddNoteOpen(true)
                    setAddNoteItemId(+itemId)

                    if (row.productNote) {
                      setNotes(row.productNote)
                    }
                  }}
                />
              </Grid>
              <Grid
                item
                sx={{
                  marginRight: canChangeOption ? '0.5rem' : '',
                  marginLeft: canChangeOption ? '0.3rem' : '',
                }}
              >
                {canChangeOption && (
                  <Edit
                    sx={{
                      cursor: 'pointer',
                      color: 'rgba(0, 0, 0, 0.54)',
                    }}
                    onClick={() => {
                      const {
                        productsSearch,
                        variantId,
                        itemId,
                        optionList,
                        quantity,
                      } = row

                      handleOpenProductEdit(
                        {
                          ...productsSearch,
                          selectOptions: optionList,
                          quantity,
                        },
                        variantId,
                        itemId
                      )
                    }}
                  />
                )}
              </Grid>
              <Grid
                item
                sx={{
                  marginLeft: '0.3rem',
                }}
              >
                {!isReadForApprove && !isJuniorApprove && (
                  <Delete
                    sx={{
                      cursor: 'pointer',
                      color: 'rgba(0, 0, 0, 0.54)',
                    }}
                    onClick={() => {
                      setDeleteOpen(true)
                      setDeleteItemId(+itemId)
                    }}
                  />
                )}
              </Grid>
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
    <StyledShoppingListTableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 1rem 0',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {b3Lang('shoppingList.table.totalProductCount', {
            quantity: shoppingListInfo?.products?.totalCount || 0,
          })}
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {priceHidden
            ? ''
            : `${currencyFormat(shoppingListTotalPrice || 0.0)}`}
        </Typography>
      </Box>
      <Box
        sx={{
          marginBottom: '5px',
        }}
      >
        <B3FilterSearch
          searchBGColor="rgba(0, 0, 0, 0.06)"
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
        showSelectAllCheckbox
        applyAllDisableCheckbox={false}
        disableCheckbox={
          disabledSelectAll ||
          (+role === 2
            ? !(allowJuniorPlaceOrder || productQuoteEnabled)
            : isReadForApprove || isJuniorApprove)
          // allowJuniorPlaceOrder
          //   ? !allowJuniorPlaceOrder
          //   : isReadForApprove || isJuniorApprove
        }
        hover
        labelRowsPerPage={b3Lang('shoppingList.table.itemsPerPage')}
        showBorder={false}
        requestLoading={setIsRequestLoading}
        getSelectCheckbox={getSelectCheckbox}
        itemIsMobileSpacing={0}
        noDataText={b3Lang('shoppingList.table.noProductsFound')}
        sortDirection={order}
        orderBy={orderBy}
        sortByFn={handleSetOrderBy}
        pageType="shoppingListDetailsTable"
        renderItem={(
          row: ProductInfoProps,
          index?: number,
          checkBox?: () => ReactElement
        ) => (
          <ShoppingDetailCard
            len={shoppingListInfo?.products?.edges.length || 0}
            item={row}
            itemIndex={index}
            showPrice={showPrice}
            onEdit={handleOpenProductEdit}
            onDelete={setDeleteItemId}
            checkBox={checkBox}
            setDeleteOpen={setDeleteOpen}
            setAddNoteOpen={setAddNoteOpen}
            setAddNoteItemId={setAddNoteItemId}
            setNotes={setNotes}
            handleUpdateProductQty={handleUpdateProductQty}
            handleUpdateShoppingListItem={handleUpdateShoppingListItemQty}
            isReadForApprove={isReadForApprove || isJuniorApprove}
          />
        )}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isRequestLoading}
        setIsLoading={setIsRequestLoading}
        product={optionsProduct}
        type="shoppingList"
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        isEdit
        isB2BUser={isB2BUser}
      />

      <ShoppingDetailAddNotes
        open={addNoteOpen}
        notes={notes}
        setNotes={setNotes}
        handleCancelAddNotesClick={handleCancelAddNotesClick}
        handleAddItemNotesClick={handleAddItemNotesClick}
      />
    </StyledShoppingListTableContainer>
  )
}

export default forwardRef(ShoppingDetailTable)
