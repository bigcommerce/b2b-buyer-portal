import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import { ArrowDropDown } from '@mui/icons-material'
import {
  Box,
  Button,
  Grid,
  Menu,
  MenuItem,
  SxProps,
  Typography,
  useMediaQuery,
} from '@mui/material'
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
import { globalStateSelector } from '@/store'
import {
  addQuoteDraftProducts,
  B3SStorage,
  b3TriggerCartNumber,
  calculateProductListPrice,
  currencyFormat,
  getProductPriceIncTax,
  getValidOptionsList,
  snackbar,
  validProductQty,
} from '@/utils'
import { conversionProductsList } from '@/utils/b3Product/shared/config'
import { callCart } from '@/utils/cartUtils'

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
      productQuoteEnabled = false,
      shoppingListEnabled = false,
    },
  } = useContext(GlobaledContext)
  const b3Lang = useB3Lang()

  const { role, checkedArr, isAgenting, setIsRequestLoading, isB2BUser } = props

  const isDesktopLimit = useMediaQuery('(min-width:1775px)')
  const [isMobile] = useMobile()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [open, setOpen] = useState<boolean>(Boolean(anchorEl))
  const [selectedSubTotal, setSelectedSubTotal] = useState<number>(0.0)
  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] =
    useState<boolean>(false)
  const [isShoppingListLoading, setIisShoppingListLoading] =
    useState<boolean>(false)

  const { storeInfo } = useSelector(globalStateSelector)

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
      snackbar.error(b3Lang('purchasedProducts.footer.selectOneItem'))
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
    const lineItems: CustomFieldItems[] = []

    checkedArr.forEach((item: ProductsProps) => {
      const { node } = item

      const currentProduct: CustomFieldItems | undefined = inventoryInfos.find(
        (inventory: CustomFieldItems) => +node.productId === inventory.id
      )
      if (currentProduct) {
        const { variants }: CustomFieldItems = currentProduct

        if (variants.length > 0) {
          const currentInventoryInfo: CustomFieldItems | undefined =
            variants.find(
              (variant: CustomFieldItems) =>
                node.variantSku === variant.sku &&
                +node.variantId === +variant.variant_id
            )

          if (currentInventoryInfo) {
            const { optionList, quantity } = node

            const options = optionList.map((option: CustomFieldItems) => ({
              optionId: option.product_option_id,
              optionValue: option.value,
            }))

            lineItems.push({
              optionSelections: options,
              productId: parseInt(currentInventoryInfo.product_id, 10) || 0,
              quantity,
              variantId: parseInt(currentInventoryInfo.variant_id, 10) || 0,
            })
          }
        }
      }
    })

    return lineItems
  }

  const handleAddSelectedToCart = async () => {
    setIsRequestLoading(true)
    handleClose()
    try {
      const productIds: number[] = []

      checkedArr.forEach((item: ProductsProps) => {
        const { node } = item

        if (!productIds.includes(+node.productId)) {
          productIds.push(+node.productId)
        }
      })

      const getVariantInfoByProductId = isB2BUser
        ? searchB2BProducts
        : searchBcProducts

      if (productIds.length === 0) {
        snackbar.error(b3Lang('purchasedProducts.footer.selectOneItemToAdd'))
        return
      }

      const companyId =
        B3SStorage.get('B3CompanyInfo')?.id ||
        B3SStorage.get('salesRepCompanyId')
      const customerGroupId = B3SStorage.get('B3CustomerInfo')?.customerGroupId

      const { productsSearch: getInventoryInfos } =
        await getVariantInfoByProductId({
          productIds,
          companyId,
          customerGroupId,
        })

      const lineItems = handleSetCartLineItems(getInventoryInfos || [])

      const storePlatform = storeInfo?.platform

      const res = await callCart(lineItems, storePlatform)

      if (res && !res.errors) {
        snackbar.success('', {
          jsx: successTip({
            message: b3Lang('purchasedProducts.footer.productsAdded'),
            link: '/cart.php',
            linkText: b3Lang('purchasedProducts.footer.viewCart'),
            isOutLink: true,
          }),
          isClose: true,
        })
      } else {
        snackbar.error('Error has occurred', {
          isClose: true,
        })
      }
    } finally {
      b3TriggerCartNumber()
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

      const noSkuProducts = checkedArr.filter((checkedItem: ListItemProps) => {
        const {
          node: { variantSku },
        } = checkedItem

        return !variantSku
      })
      if (noSkuProducts.length > 0) {
        snackbar.error(
          b3Lang('purchasedProducts.footer.cantAddProductsNoSku'),
          {
            isClose: true,
          }
        )
      }
      if (noSkuProducts.length === checkedArr.length) return

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
          errorMessage = b3Lang('purchasedProducts.footer.notFoundSku', {
            sku: variantSku,
          })
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
            message: b3Lang('purchasedProducts.footer.productsAddedToQuote'),
            link: '/quoteDraft',
            linkText: b3Lang('purchasedProducts.footer.viewQuote'),
            isOutLink: false,
          }),
          isClose: true,
        })
      } else {
        snackbar.error('', {
          jsx: successTip({
            message: b3Lang('purchasedProducts.footer.productsLimit'),
            link: '/quoteDraft',
            linkText: b3Lang('purchasedProducts.footer.viewQuote'),
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
        {b3Lang('purchasedProducts.footer.productsAddedToShoppingList')}
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
          node: { optionList, productId, quantity, variantId, productsSearch },
        } = product

        const optionsList = getOptionsList(optionList)

        const newOptionLists = getValidOptionsList(optionsList, productsSearch)
        items.push({
          productId: +productId,
          variantId: +variantId,
          quantity: +quantity,
          optionList: newOptionLists,
        })
      })

      const addToShoppingList = isB2BUser
        ? addProductToShoppingList
        : addProductToBcShoppingList

      await addToShoppingList({
        shoppingListId: +shoppingListId,
        items,
      })

      snackbar.success(
        b3Lang('purchasedProducts.footer.productsAddedToShoppingList'),
        {
          jsx: () => tip(shoppingListId),
          isClose: true,
        }
      )
      handleShoppingClose(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIisShoppingListLoading(false)
    }
  }

  const buttonList = [
    {
      name: b3Lang('purchasedProducts.footer.addToCart'),
      key: 'add-selected-to-cart',
      handleClick: handleAddSelectedToCart,
      isDisabled: role === 2,
    },
    {
      name: b3Lang('purchasedProducts.footer.addToQuote'),
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
      isDisabled: !productQuoteEnabled,
    },
    {
      name: b3Lang(
        'purchasedProducts.footer.addSelectedProductsToShoppingList'
      ),
      key: 'add-selected-to-shoppingList',
      handleClick: handleCreateShoppingClick,
      isDisabled: !shoppingListEnabled,
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

  let gridBarStyles: SxProps = {
    display: isMobile ? 'initial' : 'flex',
    flexBasis: '100%',
  }

  if (isDesktopLimit) {
    gridBarStyles = {
      display: 'flex',
      flexGrow: 1,
      maxWidth: 1775,
      margin: 'auto',
    }
  }

  return (
    <>
      <Grid
        sx={{
          position: 'fixed',
          bottom: isMobile && isAgenting ? '52px' : 0,
          left: 0,
          backgroundColor: '#fff',
          width: '100%',
          padding: isMobile ? '0 0 1rem 0' : '16px 0 16px',
          height: isMobile ? '8rem' : 'auto',
          marginLeft: 0,
          display: 'flex',
          flexWrap: 'nowrap',
          zIndex: '1000',
        }}
        container
        spacing={2}
      >
        <Grid item={isMobile} sx={gridBarStyles}>
          <Box
            sx={{
              width: 263,
              display: isMobile ? 'none' : 'block',
            }}
          />
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: isMobile ? 0 : '50px',
              paddingRight: isMobile ? 0 : '80px',
            }}
          >
            <Box
              sx={{
                width: isMobile ? '100%' : 'calc(66.6667% + 32px)',
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
                {b3Lang('purchasedProducts.footer.selectedProducts', {
                  quantity: checkedArr.length,
                })}
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
                  {b3Lang('purchasedProducts.footer.subtotal', {
                    subtotal: currencyFormat(selectedSubTotal),
                  })}
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
                    {b3Lang('purchasedProducts.footer.addSelectedTo')}
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
            <Box
              sx={{
                width: '33.3333%',
                display: !isMobile ? 'block' : 'none',
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <OrderShoppingList
        isOpen={openShoppingList}
        dialogTitle={b3Lang('purchasedProducts.footer.addToShoppingList')}
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
