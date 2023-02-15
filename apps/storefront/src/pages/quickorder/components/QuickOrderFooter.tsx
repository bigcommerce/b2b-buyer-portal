import {
  useState,
  MouseEvent,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  v1 as uuid,
} from 'uuid'

import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
} from '@mui/material'

import {
  ArrowDropDown,
} from '@mui/icons-material'

import {
  useMobile,
} from '@/hooks'

import {
  searchB2BProducts,
  addProductToShoppingList,
} from '@/shared/service/b2b'

import {
  createCart,
  getCartInfo,
  addProductToCart,
} from '@/shared/service/bc'

import {
  snackbar,
  getDefaultCurrencyInfo,
  addQuoteDraftProduce,
} from '@/utils'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  getB2BVariantInfoBySkus,
} from '@/shared/service/b2b/graphql/product'

import {
  B3LinkTipContent,
} from '@/components'

import {
  conversionProductsList,
} from '../../shoppingListDetails/shared/config'

import {
  OrderShoppingList,
} from '../../orderDetail/components/OrderShoppingList'

import CreateShoppingList from '../../orderDetail/components/CreateShoppingList'

export interface ProductInfoProps {
  basePrice: number | string,
  baseSku: string,
  createdAt: number,
  discount: number | string,
  enteredInclusive: boolean,
  id: number | string,
  itemId: number,
  optionList: CustomFieldItems,
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

export interface ListItemProps {
  node: ProductInfoProps,
}

interface NodeProps {
  basePrice: number | string,
  baseSku: string,
  createdAt: number,
  discount: number | string,
  enteredInclusive: boolean,
  id: number | string,
  itemId: number,
  optionList: CustomFieldItems,
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

interface ProductsProps {
  maxQuantity?: number,
  minQuantity?: number,
  stock?: number,
  isStock?: string,
  node: NodeProps
  isValid?: boolean,
}

interface successTipOptions{
  message: string,
  link?: string,
  linkText?: string,
  isOutLink?: boolean,
}

const successTip = (options: successTipOptions) => () => (
  <B3LinkTipContent
    message={options.message}
    link={options.link}
    linkText={options.linkText}
    isOutLink={options.isOutLink}
  />
)

interface QuickOrderFooterProps {
  checkedArr: CustomFieldItems,
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>,
}

const QuickOrderFooter = (props: QuickOrderFooterProps) => {
  const {
    checkedArr,
    setIsRequestLoading,
  } = props

  const [isMobile] = useMobile()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [open, setOpen] = useState<boolean>(Boolean(anchorEl))
  const [selectedSubTotal, setSelectedSubTotal] = useState<number>(0.00)
  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] = useState<boolean>(false)
  const [isShoppingListLoading, setIisShoppingListLoading] = useState<boolean>(false)

  const navigate = useNavigate()

  const containerStyle = isMobile ? {
    alignItems: 'flex-start',
    flexDirection: 'column',
  } : {
    alignItems: 'center',
  }

  const handleOpenBtnList = (e: MouseEvent<HTMLButtonElement>) => {
    if (checkedArr.length === 0) {
      snackbar.error('Please select at least one item')
    } else {
      setAnchorEl(e.currentTarget)
      setOpen(true)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
    setOpen(false)
  }

  const {
    token: currencyToken,
  } = getDefaultCurrencyInfo()

  // Add selected to cart
  const handleSetCartLineItems = (inventoryInfos: ProductsProps[]) => {
    const lineItems: CustomFieldItems = []

    checkedArr.forEach((item: ProductsProps) => {
      const {
        node,
      } = item

      inventoryInfos.forEach((inventory: CustomFieldItems) => {
        if (node.variantSku === inventory.variantSku) {
          const {
            optionList,
            quantity,
          } = node

          const options = optionList.map((option: CustomFieldItems) => ({
            optionId: option.product_option_id,
            optionValue: option.value,
          }))

          lineItems.push({
            optionList: options,
            productId: parseInt(inventory.productId, 10) || 0,
            quantity,
            variantId: parseInt(inventory.variantId, 10) || 0,
          })
        }
      })
    })

    return lineItems
  }

  const handleAddSelectedToCart = async () => {
    setIsRequestLoading(true)
    handleClose()
    try {
      const skus: string[] = []

      checkedArr.forEach((item: ProductsProps) => {
        const {
          node,
        } = item

        skus.push(node.variantSku)
      })

      if (skus.length === 0) {
        snackbar.error('Please select at least one item to add to cart')
        return
      }

      const getInventoryInfos = await getB2BVariantInfoBySkus({
        skus,
      })

      const lineItems = handleSetCartLineItems(getInventoryInfos?.variantSku || [])

      const cartInfo = await getCartInfo()
      const res = cartInfo.length ? await addProductToCart({
        lineItems,
      }, cartInfo[0].id) : await createCart({
        lineItems,
      })
      if (res.status) {
        snackbar.error(res.detail)
      } else if (!res.status) {
        snackbar.success('', {
          jsx: successTip({
            message: 'Products were added to cart',
            link: '/cart.php',
            linkText: 'VIEW CART',
            isOutLink: true,
          }),
          isClose: true,
        })
      }
    } finally {
      setIsRequestLoading(false)
    }
  }

  // Add selected to quote
  const getOptionsList = (options: CustomFieldItems) => {
    if (options?.length === 0) return []

    const option = options.map(({
      product_option_id: optionId,
      value,
    }: {
      product_option_id: number | string,
      value: string | number,
    }) => ({
      optionId: `attribute[${optionId}]`,
      optionValue: value,
    }))

    return option
  }

  const handleAddSelectedToQuote = async () => {
    setIsRequestLoading(true)
    handleClose()
    try {
      const productsWithSku = checkedArr.filter((checkedItem: ListItemProps) => {
        const {
          node: {
            variantSku,
          },
        } = checkedItem

        return variantSku !== '' && variantSku !== null && variantSku !== undefined
      })

      const productIds: number[] = []
      productsWithSku.forEach((product: ListItemProps) => {
        const {
          node,
        } = product

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId)
        }
      })

      const {
        productsSearch,
      } = await searchB2BProducts({
        productIds,
      })

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch)

      productsWithSku.forEach((product: ListItemProps) => {
        const {
          node: {
            optionList,
            variantSku,
            productId,
            productName,
            quantity,
            variantId,
          },
        } = product

        const optionsList = getOptionsList(optionList)
        const currentProductSearch = newProductInfo.find((product: CustomFieldItems) => +product.id === +productId)

        const variantItem = currentProductSearch.variants.find((item: CustomFieldItems) => item.sku === variantSku)

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: variantItem.sku,
            variantId,
            productsSearch: currentProductSearch,
            primaryImage: variantItem.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: +quantity || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice: variantItem.bc_calculated_price.as_entered,
            tax: variantItem.bc_calculated_price.tax_inclusive - variantItem.bc_calculated_price.tax_exclusive,
          },
        }

        addQuoteDraftProduce(quoteListitem, +quantity, optionsList || [])

        snackbar.success('Products were added to your quote.')
      })
    } catch (e) {
      console.log(e)
    } finally {
      setIsRequestLoading(false)
    }
  }

  // Add selected to shopping list
  const gotoShoppingDetail = (id: string | number) => {
    navigate(`/shoppingList/${id}`)
  }

  const tip = (id: string | number) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          mr: '15px',
        }}
      >
        Products were added to your shopping list
      </Box>
      <Button
        onClick={() => gotoShoppingDetail(id)}
        variant="text"
        sx={{
          color: '#ffffff',
        }}
      >
        view shopping list
      </Button>
    </Box>
  )

  const handleShoppingClose = (isTrue?: boolean) => {
    if (isTrue) {
      setOpenShoppingList(false)
      setIsOpenCreateShopping(false)
    } else {
      setOpenShoppingList(false)
      setIsOpenCreateShopping(false)
    }
  }

  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false)
    setIsOpenCreateShopping(true)
  }

  const handleCloseShoppingClick = () => {
    setIsOpenCreateShopping(false)
    setOpenShoppingList(true)
  }

  const handleCreateShoppingClick = () => {
    handleClose()
    handleCloseShoppingClick()
    setOpenShoppingList(true)
  }

  const handleAddSelectedToShoppingList = async (shoppingListId: string | number) => {
    setIisShoppingListLoading(true)
    try {
      const productIds: number[] = []
      checkedArr.forEach((product: ListItemProps) => {
        const {
          node,
        } = product

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId)
        }
      })

      const items: CustomFieldItems = []

      checkedArr.forEach((product: ListItemProps) => {
        const {
          node: {
            optionList,
            productId,
            quantity,
            variantId,
          },
        } = product

        const optionsList = getOptionsList(optionList)

        items.push({
          productId: +productId,
          variantId: +variantId,
          quantity: +quantity,
          optionList: optionsList,
        })
      })

      await addProductToShoppingList({
        shoppingListId: +shoppingListId,
        items,
      })

      snackbar.success('Products were added to your shopping list', {
        jsx: () => tip(shoppingListId),
        isClose: true,
      })
      handleShoppingClose(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIisShoppingListLoading(false)
    }
  }

  const buttonList = [{
    name: 'Add selected to cart',
    key: 'add-selected-to-cart',
    handleClick: handleAddSelectedToCart,
  }, {
    name: 'Add selected to quote',
    key: 'add-selected-to-quote',
    handleClick: handleAddSelectedToQuote,
  }, {
    name: 'Add selected to shopping list',
    key: 'add-selected-to-shoppingList',
    handleClick: handleCreateShoppingClick,
  }]

  useEffect(() => {
    if (checkedArr.length > 0) {
      let total = 0.00

      checkedArr.forEach((item: ListItemProps) => {
        const {
          node,
        } = item

        total += +node.basePrice * +node.quantity
      })

      setSelectedSubTotal((1000 * total) / 1000)
    } else {
      setSelectedSubTotal(0.00)
    }
  }, [checkedArr])

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          backgroundColor: '#fff',
          width: '100%',
          padding: '1rem',
          height: isMobile ? '8rem' : 'auto',
          display: 'flex',
          zIndex: '999',
          ...containerStyle,
        }}
      >
        <Typography
          sx={{
            marginLeft: isMobile ? '0' : '23%',
            marginRight: '7%',
          }}
        >
          {`${checkedArr.length} products selected`}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontSize: '16px',
            fontWeight: '700',
          }}
        >
          {`Subtotal: ${currencyToken}${selectedSubTotal.toFixed(2)}`}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            marginTop: isMobile ? '0.5rem' : 0,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <Button
            variant="contained"
            onClick={handleOpenBtnList}
            sx={{
              marginLeft: isMobile ? 0 : '1rem',
              width: isMobile ? '80%' : 'auto',
            }}
            endIcon={<ArrowDropDown />}
          >
            Add selected to
          </Button>

          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            {
              buttonList.length > 0 && (
                buttonList.map((button) => (
                  <MenuItem
                    key={button.key}
                    onClick={() => {
                      button.handleClick()
                    }}
                  >
                    {button.name}
                  </MenuItem>
                ))
              )
            }

          </Menu>
        </Box>
      </Box>

      <OrderShoppingList
        isOpen={openShoppingList}
        dialogTitle="Add to shopping list"
        onClose={handleShoppingClose}
        onConfirm={handleAddSelectedToShoppingList}
        onCreate={handleOpenCreateDialog}
        isLoading={isShoppingListLoading}
        setLoading={setIisShoppingListLoading}
      />

      <CreateShoppingList
        open={isOpenCreateShopping}
        onChange={handleCreateShoppingClick}
        onClose={handleCloseShoppingClick}
      />
    </>
  )
}

export default QuickOrderFooter
