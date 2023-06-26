import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDropDown } from '@mui/icons-material'
import { Box, Button, Grid, Menu, MenuItem, Typography } from '@mui/material'
import { v1 as uuid } from 'uuid'

import { CustomButton, successTip } from '@/components'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'
import {
  getB2BVariantInfoBySkus,
  getBcVariantInfoBySkus,
} from '@/shared/service/b2b/graphql/product'
import { addProductToCart, createCart, getCartInfo } from '@/shared/service/bc'
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  currencyFormat,
  getProductPriceIncTax,
  snackbar,
  validProductQty,
} from '@/utils'
import { conversionProductsList } from '@/utils/b3Product/shared/config'

import CreateShoppingList from '../../orderDetail/components/CreateShoppingList'
import OrderShoppingList from '../../orderDetail/components/OrderShoppingList'

export interface ProductInfoProps {
  basePrice: number | string
  baseSku: string
  createdAt: number
  discount: number | string
  enteredInclusive: boolean
  id: number | string
  itemId: number
  optionList: CustomFieldItems
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

export interface ListItemProps {
  node: ProductInfoProps
}

interface NodeProps {
  basePrice: number | string
  baseSku: string
  createdAt: number
  discount: number | string
  enteredInclusive: boolean
  id: number | string
  itemId: number
  optionList: CustomFieldItems
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
  optionSelections: CustomFieldItems
}

interface ProductsProps {
  maxQuantity?: number
  minQuantity?: number
  stock?: number
  isStock?: string
  node: NodeProps
  isValid?: boolean
}

interface QuickOrderFooterProps {
  role: number | string
  checkedArr: CustomFieldItems
  isAgenting: boolean
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>
  isB2BUser: boolean
}

function QuickOrderFooter(props: QuickOrderFooterProps) {
  const {
    state: {
      companyInfo: { id: companyId },
      customer: { customerGroupId },
    },
  } = useContext(GlobaledContext)

  const { role, checkedArr, isAgenting, setIsRequestLoading, isB2BUser } = props

  const [isMobile] = useMobile()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [open, setOpen] = useState<boolean>(Boolean(anchorEl))
  const [selectedSubTotal, setSelectedSubTotal] = useState<number>(0.0)
  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] =
    useState<boolean>(false)
  const [isShoppingListLoading, setIisShoppingListLoading] =
    useState<boolean>(false)

  const navigate = useNavigate()

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
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

  // Add selected to cart
  const handleSetCartLineItems = (inventoryInfos: ProductsProps[]) => {
    const lineItems: CustomFieldItems = []

    checkedArr.forEach((item: ProductsProps) => {
      const { node } = item

      inventoryInfos.forEach((inventory: CustomFieldItems) => {
        if (node.variantSku === inventory.variantSku) {
          const { optionList, quantity } = node

          const options = optionList.map((option: CustomFieldItems) => ({
            optionId: option.product_option_id,
            optionValue: option.value,
          }))

          lineItems.push({
            optionSelections: options,
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
        const { node } = item

        skus.push(node.variantSku)
      })

      const getVariantInfoBySku = isB2BUser
        ? getB2BVariantInfoBySkus
        : getBcVariantInfoBySkus

      if (skus.length === 0) {
        snackbar.error('Please select at least one item to add to cart')
        return
      }

      const getInventoryInfos = await getVariantInfoBySku({
        skus,
      })

      const lineItems = handleSetCartLineItems(
        getInventoryInfos?.variantSku || []
      )

      const cartInfo = await getCartInfo()
      const res = cartInfo.length
        ? await addProductToCart(
            {
              lineItems,
            },
            cartInfo[0].id
          )
        : await createCart({
            lineItems,
          })

      if (res.status) {
        snackbar.error(res.detail, {
          isClose: true,
        })
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

    const option = options.map(
      ({
        product_option_id: optionId,
        value,
      }: {
        product_option_id: number | string
        value: string | number
      }) => ({
        optionId: `attribute[${optionId}]`,
        optionValue: value,
      })
    )

    return option
  }

  const handleAddSelectedToQuote = async () => {
    setIsRequestLoading(true)
    handleClose()
    try {
      const productsWithSku = checkedArr.filter(
        (checkedItem: ListItemProps) => {
          const {
            node: { variantSku },
          } = checkedItem

          return (
            variantSku !== '' && variantSku !== null && variantSku !== undefined
          )
        }
      )

      const productIds: number[] = []
      productsWithSku.forEach((product: ListItemProps) => {
        const { node } = product

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId)
        }
      })

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      const { productsSearch } = await getProducts({
        productIds,
        companyId,
        customerGroupId,
      })

      const newProductInfo: CustomFieldItems =
        conversionProductsList(productsSearch)
      let isSuccess = false
      let errorMessage = ''
      let isFondVariant = true

      const newProducts: CustomFieldItems[] = []
      productsWithSku.forEach((product: ListItemProps) => {
        const {
          node: {
            basePrice,
            optionList,
            variantSku,
            productId,
            productName,
            quantity,
            variantId,
            tax,
          },
        } = product

        const optionsList = getOptionsList(optionList)

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => +product.id === +productId
        )

        const variantItem = currentProductSearch?.variants.find(
          (item: CustomFieldItems) => item.sku === variantSku
        )

        if (!variantItem) {
          errorMessage = `${variantSku} not found`
          isFondVariant = false
        }

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: variantItem?.sku || variantSku,
            variantId,
            productsSearch: currentProductSearch,
            primaryImage: variantItem?.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: +quantity || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice,
            tax,
          },
        }

        newProducts.push(quoteListitem)

        isSuccess = true
      })

      isSuccess = validProductQty(newProducts)

      if (!isFondVariant) {
        snackbar.error('', {
          jsx: successTip({
            message: errorMessage,
            link: '',
            linkText: '',
            isOutLink: false,
          }),
          isClose: true,
        })

        return
      }

      if (isSuccess) {
        await calculateProductListPrice(newProducts, '2')
        addQuoteDraftProducts(newProducts)
        snackbar.success('', {
          jsx: successTip({
            message: 'Products were added to your quote.',
            link: '/quoteDraft',
            linkText: 'VIEW QUOTE',
            isOutLink: false,
          }),
          isClose: true,
        })
      } else {
        snackbar.error('', {
          jsx: successTip({
            message: 'The quantity of each product in Quote is 1-1000000.',
            link: '/quoteDraft',
            linkText: 'VIEW QUOTE',
            isOutLink: false,
          }),
          isClose: true,
        })
      }
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
          padding: 0,
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

  const handleAddSelectedToShoppingList = async (
    shoppingListId: string | number
  ) => {
    setIisShoppingListLoading(true)
    try {
      const productIds: number[] = []
      checkedArr.forEach((product: ListItemProps) => {
        const { node } = product

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId)
        }
      })

      const items: CustomFieldItems = []

      checkedArr.forEach((product: ListItemProps) => {
        const {
          node: { optionList, productId, quantity, variantId },
        } = product

        const optionsList = getOptionsList(optionList)

        items.push({
          productId: +productId,
          variantId: +variantId,
          quantity: +quantity,
          optionList: optionsList,
        })
      })

      const addToShoppingList = isB2BUser
        ? addProductToShoppingList
        : addProductToBcShoppingList

      await addToShoppingList({
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

  const buttonList = [
    {
      name: 'Add selected to cart',
      key: 'add-selected-to-cart',
      handleClick: handleAddSelectedToCart,
      isDisabled: role === 2,
    },
    {
      name: 'Add selected to quote',
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
    },
    {
      name: 'Add selected to shopping list',
      key: 'add-selected-to-shoppingList',
      handleClick: handleCreateShoppingClick,
    },
  ]

  useEffect(() => {
    if (checkedArr.length > 0) {
      let total = 0.0

      checkedArr.forEach((item: ListItemProps) => {
        const {
          node: {
            variantId,
            productsSearch: { variants },
            quantity,
            basePrice,
          },
        } = item

        if (variants?.length) {
          const priceIncTax =
            getProductPriceIncTax(variants, +variantId) || +basePrice
          total += priceIncTax * +quantity
        } else {
          total += +basePrice * +quantity
        }
      })

      setSelectedSubTotal((1000 * total) / 1000)
    } else {
      setSelectedSubTotal(0.0)
    }
  }, [checkedArr])

  return (
    <>
      <Grid
        sx={{
          position: 'fixed',
          bottom: isMobile && isAgenting ? '52px' : 0,
          left: 0,
          backgroundColor: '#fff',
          width: '100%',
          padding: isMobile
            ? '0 0 1rem 0'
            : `0 ${open ? '57px' : '40px'} 1rem 40px`,
          height: isMobile ? '8rem' : 'auto',
          marginLeft: 0,
          display: 'flex',
          flexWrap: 'nowrap',
          zIndex: '1000',
        }}
        container
        spacing={2}
      >
        <Grid
          item
          sx={{
            display: isMobile ? 'none' : 'block',
            width: '305px',
            paddingLeft: '20px',
            marginRight: '30px',
          }}
        />
        <Grid
          item
          sx={
            isMobile
              ? {
                  flexBasis: '100%',
                }
              : {
                  flexBasis: '66.6667%',
                  flexGrow: 1,
                  maxWidth: '66.6667%',
                }
          }
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              zIndex: '999',
              justifyContent: 'space-between',
              ...containerStyle,
            }}
          >
            <Typography
              sx={{
                color: '#000000',
                fontSize: '16px',
                fontWeight: '400',
              }}
            >
              {`${checkedArr.length} products selected`}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#000000',
                }}
              >
                {`Subtotal: ${currencyFormat(selectedSubTotal)}`}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: isMobile ? '0.5rem' : 0,
                  marginLeft: isMobile ? 0 : '20px',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                <CustomButton
                  variant="contained"
                  onClick={handleOpenBtnList}
                  sx={{
                    marginRight: isMobile ? '1rem' : 0,
                    width: isMobile ? '100%' : 'auto',
                  }}
                  endIcon={<ArrowDropDown />}
                >
                  Add selected to
                </CustomButton>

                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  {buttonList.length > 0 &&
                    buttonList.map((button) => {
                      if (button.isDisabled) return null

                      return (
                        <MenuItem
                          key={button.key}
                          onClick={() => {
                            button.handleClick()
                          }}
                        >
                          {button.name}
                        </MenuItem>
                      )
                    })}
                </Menu>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          sx={
            isMobile
              ? {
                  flexBasis: '100%',
                  display: isMobile ? 'none' : 'block',
                }
              : {
                  flexBasis: '33.3333%',
                  display: isMobile ? 'none' : 'block',
                  maxWidth: '33.3333%',
                  marginRight: '16px',
                }
          }
        />
      </Grid>
      {/* <Box
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

      </Box> */}

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
