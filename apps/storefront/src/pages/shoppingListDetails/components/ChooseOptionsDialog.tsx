import {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import { FieldValues, useForm } from 'react-hook-form'
import styled from '@emotion/styled'
import { Box, Divider, TextField, Typography } from '@mui/material'

import { B3CustomForm, B3Dialog, B3Sping } from '@/components'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import { store } from '@/store'
import {
  B3SStorage,
  calculateProductListPrice,
  currencyFormat,
  snackbar,
} from '@/utils'
import { getBCPrice } from '@/utils/b3Product/b3Product'

import {
  AllOptionProps,
  ShoppingListProductItem,
  SimpleObject,
  Variant,
} from '../../../types'
import {
  Base64,
  getOptionRequestData,
  getProductOptionsFields,
} from '../../../utils/b3Product/shared/config'

const Flex = styled('div')(() => ({
  display: 'flex',
  wordBreak: 'break-word',
  gap: '8px',
  flexWrap: 'wrap',
  padding: '12px 0 12px',
  '&:first-of-type': {
    marginTop: '12px',
  },
}))

interface FlexItemProps {
  padding?: string
}

const FlexItem = styled('div')(({ padding }: FlexItemProps) => ({
  display: 'flex',
  flexGrow: 1,
  flexShrink: 1,
  alignItems: 'flex-start',
  width: '100%',
  padding: padding || '0 0 0 16px',
}))

const ProductImage = styled('img')(() => ({
  width: '60px',
  height: '60px',
  borderRadius: '4px',
  marginTop: '12px',
  flexShrink: 0,
}))

const ProductOptionText = styled('div')(() => ({
  fontSize: '0.75rem',
  lineHeight: '1.5',
  color: '#455A64',
}))

const StyleTextField = styled(TextField)(() => ({
  '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
    marginTop: '-8px',
    marginBottom: '8px',
  },
}))

interface ChooseOptionsDialogProps {
  isOpen: boolean
  product?: ShoppingListProductItem
  onCancel: () => void
  onConfirm: (products: CustomFieldItems[]) => void
  isEdit?: boolean
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  addButtonText?: string
  isB2BUser: boolean
}

interface ChooseOptionsProductProps extends ShoppingListProductItem {
  newSelectOptionList: {
    optionId: string
    optionValue: any
  }[]
  productId: number
  quantity: number
  variantId: number
  additionalProducts: CustomFieldItems
}

export default function ChooseOptionsDialog(props: ChooseOptionsDialogProps) {
  const {
    isOpen,
    onCancel,
    onConfirm,
    product,
    isEdit = false,
    isLoading,
    setIsLoading,
    addButtonText = 'Add To List',
    isB2BUser,
  } = props

  const {
    global: { showInclusiveTaxPrice },
  } = store.getState()

  const [quantity, setQuantity] = useState<number | string>(1)
  const [formFields, setFormFields] = useState<CustomFieldItems[]>([])
  const [variantInfo, setVariantInfo] = useState<Partial<Variant> | null>(null)
  const [variantSku, setVariantSku] = useState('')
  const [additionalProducts, setAdditionalProducts] =
    useState<CustomFieldItems>({})
  const [productPriceChangeOptions, setProductPriceChangeOptions] = useState<
    Partial<AllOptionProps>[]
  >([])
  const [newPrice, setNewPrice] = useState<number>(0)
  const [chooseOptionsProduct, setChooseOptionsProduct] = useState<
    ChooseOptionsProductProps[]
  >([])
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const setChooseOptionsForm = async (product: ShoppingListProductItem) => {
    try {
      setIsLoading(true)

      const modifiers =
        product?.modifiers?.filter(
          (modifier) => modifier.type === 'product_list_with_images'
        ) || []
      const productImages: SimpleObject = {}
      const additionalProductsParams: CustomFieldItems = {}
      if (modifiers.length > 0) {
        const productIds = modifiers.reduce((arr: number[], modifier) => {
          const { option_values: optionValues } = modifier
          optionValues.forEach((option) => {
            if (option?.value_data?.product_id) {
              arr.push(option.value_data.product_id)
            }
          })
          return arr
        }, [])

        if (productIds.length > 0) {
          const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

          const companyId =
            B3SStorage.get('B3CompanyInfo')?.id ||
            B3SStorage.get('salesRepCompanyId')
          const customerGroupId =
            B3SStorage.get('B3CustomerInfo')?.customerGroupId
          const { productsSearch }: CustomFieldItems = await getProducts({
            productIds,
            companyId,
            customerGroupId,
          })

          productsSearch.forEach((product: CustomFieldItems) => {
            productImages[product.id] = product.imageUrl
            additionalProductsParams[product.id] = product
          })
        }
      }

      setAdditionalProducts(additionalProductsParams)

      setQuantity(product.quantity)
      if (product.variants?.length === 1) {
        setVariantInfo(product.variants[0])
      }

      const productOptionsFields = getProductOptionsFields(
        product,
        productImages
      )
      setFormFields([...productOptionsFields])
    } finally {
      setIsLoading(false)
    }
  }

  const getProductPriceOptions = (product: ShoppingListProductItem) => {
    const newProductPriceChangeOptionLists: Partial<AllOptionProps>[] = []
    product.allOptions?.forEach((item) => {
      if (
        item.type === 'product_list_with_images' ||
        item.type === 'product_list' ||
        item.type === 'checkbox' ||
        item.type === 'rectangles' ||
        item.type === 'swatch' ||
        item.type === 'radio_buttons' ||
        item.type === 'dropdown'
      ) {
        newProductPriceChangeOptionLists.push(item)
      }
    })

    setProductPriceChangeOptions(newProductPriceChangeOptionLists)
  }

  useEffect(() => {
    if (product) {
      setChooseOptionsForm(product)
      setChooseOptionsProduct([])
      setNewPrice(0)
      setFormFields([])
      if (product?.allOptions?.length) {
        getProductPriceOptions(product)
      }
    } else {
      setQuantity(1)
      setFormFields([])
    }
  }, [product])

  const getProductPrice = (product: ShoppingListProductItem) => {
    const { variants = [] } = product

    let priceNumber = 0
    if (variantSku) {
      const variantCalculatePrice = variants.find(
        (variant) => variant.sku === variantSku
      )?.bc_calculated_price
      priceNumber =
        (showInclusiveTaxPrice
          ? variantCalculatePrice?.tax_inclusive
          : variantCalculatePrice?.tax_exclusive) || 0
    } else {
      const variantCalculatePrice = variants[0]?.bc_calculated_price
      priceNumber =
        parseFloat(
          (showInclusiveTaxPrice
            ? variantCalculatePrice?.tax_inclusive
            : variantCalculatePrice?.tax_exclusive
          )?.toString()
        ) || 0
    }

    return priceNumber
  }

  const handleProductQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || parseInt(e.target.value, 10) > 0) {
      setQuantity(e.target.value)
    }
  }

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['KeyE', 'Equal', 'Minus'].indexOf(event.code) > -1) {
      event.preventDefault()
    }
  }

  const handleNumberInputBlur = () => {
    if (!quantity) {
      setQuantity(1)
    }

    if (+quantity > 1000000) {
      setQuantity(1000000)
    }
  }

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    mode: 'all',
  })

  const formValues = watch()

  const getProductVariantId = async (
    value: CustomFieldItems,
    changeName = ''
  ) => {
    const isVariantOptionChange =
      formFields.find((item: CustomFieldItems) => item.name === changeName)
        ?.isVariantOption || false

    if (!isVariantOptionChange || !product || !changeName) {
      return
    }

    const { variants = [] } = product || {}

    const variantInfo =
      variants.find((variant) => {
        const { option_values: optionValues = [] } = variant

        const isSelectVariant = optionValues.reduce((isSelect, option) => {
          if (
            value[
              Base64.encode(`attribute[${option.option_id}]`)
            ].toString() !== (option.id || '').toString()
          ) {
            return false
          }
          return isSelect
        }, true)

        return isSelectVariant
      }) || null

    setVariantSku(variantInfo ? variantInfo.sku : '')
    setVariantInfo(variantInfo)
  }

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      getProductVariantId(value, name)
    })

    if (formFields.length > 0) {
      const defaultValues: SimpleObject = formFields.reduce(
        (value: SimpleObject, fields) => {
          value[fields.name] = fields.default
          setValue(fields.name, fields.default)
          return value
        },
        {}
      )
      getProductVariantId(defaultValues, formFields[0].name)
    }

    return () => subscription.unsubscribe()
  }, [formFields])

  const validateQuantityNumber = () => {
    const { purchasing_disabled: purchasingDisabled = true } = variantInfo || {}

    if (purchasingDisabled === true) {
      snackbar.error('This product is no longer for sale')
      return false
    }

    return true
  }

  const getOptionList = (value: FieldValues) => {
    const optionsData = getOptionRequestData(formFields, {}, value)
    return Object.keys(optionsData).map((optionId) => ({
      optionId,
      optionValue: optionsData[optionId]?.toString(),
    }))
  }

  useEffect(() => {
    if (
      Object.keys(formValues).length &&
      formFields.length &&
      productPriceChangeOptions.length
    ) {
      const optionList = getOptionList(formValues)
      const { variant_id: variantId = '' } = variantInfo || {}
      if (!product || !product.id || !variantId || !validateQuantityNumber()) {
        return
      }

      const newChooseOptionsProduct = [
        {
          ...product,
          newSelectOptionList: optionList,
          productId: product?.id,
          quantity: parseInt(quantity.toString(), 10) || 1,
          variantId: parseInt(variantId.toString(), 10) || 1,
          additionalProducts,
        },
      ]

      if (chooseOptionsProduct.length) {
        let optionChangeFlag = false
        const { newSelectOptionList } = chooseOptionsProduct[0]
        newSelectOptionList.forEach((option) => {
          const findAttributeId = productPriceChangeOptions.findIndex((item) =>
            option.optionId.includes(String(item.id))
          )
          optionList.forEach((newOption) => {
            if (
              option.optionId === newOption.optionId &&
              option.optionValue !== newOption.optionValue &&
              findAttributeId !== -1
            ) {
              optionChangeFlag = true
            }
          })
        })
        if (optionChangeFlag) {
          setChooseOptionsProduct(newChooseOptionsProduct)
        }
      } else {
        setChooseOptionsProduct(newChooseOptionsProduct)
      }
    }
  }, [formValues, productPriceChangeOptions])

  useEffect(() => {
    const getNewProductPrice = async () => {
      try {
        if (chooseOptionsProduct.length) {
          setIsRequestLoading(true)
          const products = await calculateProductListPrice(chooseOptionsProduct)

          if (products.length) {
            const { basePrice, taxPrice } = products[0]
            const price = getBCPrice(+basePrice, +taxPrice)
            setNewPrice(price)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsRequestLoading(false)
      }
    }

    getNewProductPrice()
  }, [chooseOptionsProduct])

  const handleConfirmClicked = () => {
    handleSubmit((value) => {
      const optionList = getOptionList(value)

      const { variant_id: variantId = '' } = variantInfo || {}

      if (!product || !product.id || !variantId || !validateQuantityNumber()) {
        return
      }

      onConfirm([
        {
          ...product,
          newSelectOptionList: optionList,
          productId: product?.id,
          quantity: parseInt(quantity.toString(), 10) || 1,
          variantId: parseInt(variantId.toString(), 10) || 1,
          additionalProducts,
        },
      ])
    })()
  }

  const handleCancelClicked = () => {
    setQuantity(1)
    onCancel()
  }

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen])

  return (
    <B3Dialog
      isOpen={isOpen}
      rightSizeBtn={isEdit ? 'Save Option' : addButtonText}
      handleLeftClick={handleCancelClicked}
      handRightClick={handleConfirmClicked}
      title="Choose options"
      loading={isLoading || isRequestLoading}
    >
      <B3Sping isSpinning={isLoading}>
        {product && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} />
                <Flex>
                  <FlexItem padding="0">
                    <Box
                      sx={{
                        marginLeft: '16px',
                      }}
                    >
                      <Typography variant="body1" color="#212121">
                        {product.name}
                      </Typography>
                      <Typography variant="body1" color="#616161">
                        {variantSku || product.sku}
                      </Typography>
                      {(product.product_options || []).map((option) => (
                        <ProductOptionText
                          key={`${option.option_id}`}
                        >{`${option.display_name}: ${option.display_value}`}</ProductOptionText>
                      ))}
                    </Box>
                  </FlexItem>

                  <FlexItem>
                    <span>Price:</span>
                    {currencyFormat(
                      newPrice * +quantity || getProductPrice(product)
                    )}
                  </FlexItem>

                  <FlexItem>
                    <StyleTextField
                      type="number"
                      variant="filled"
                      label="Qty"
                      value={quantity}
                      onChange={handleProductQuantityChange}
                      onKeyDown={handleNumberInputKeyDown}
                      onBlur={handleNumberInputBlur}
                      size="small"
                      sx={{
                        width: '60%',
                        maxWidth: '100px',
                      }}
                    />
                  </FlexItem>
                </Flex>
              </Box>

              <Divider
                sx={{
                  margin: '16px 0 24px',
                }}
              />

              <B3CustomForm
                formFields={formFields}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Box>
          </Box>
        )}
      </B3Sping>
    </B3Dialog>
  )
}
