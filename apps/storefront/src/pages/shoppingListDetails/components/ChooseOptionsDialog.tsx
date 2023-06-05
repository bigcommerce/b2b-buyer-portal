import {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import styled from '@emotion/styled'
import { Box, Divider, TextField, Typography } from '@mui/material'

import { B3CustomForm, B3Dialog, B3Sping } from '@/components'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import { B3SStorage, currencyFormat, snackbar } from '@/utils'

import { ShoppingListProductItem, SimpleObject, Variant } from '../../../types'
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

  const [quantity, setQuantity] = useState<number | string>(1)
  const [formFields, setFormFields] = useState<CustomFieldItems[]>([])
  const [variantInfo, setVariantInfo] = useState<Partial<Variant> | null>(null)
  const [variantSku, setVariantSku] = useState('')
  const [additionalProducts, setAdditionalProducts] =
    useState<CustomFieldItems>({})

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

  useEffect(() => {
    if (product) {
      setChooseOptionsForm(product)
    } else {
      setQuantity(1)
      setFormFields([])
    }
  }, [product])

  const getProductPrice = (product: ShoppingListProductItem) => {
    const { variants = [] } = product

    if (variantSku) {
      const priceNumber =
        variants.find((variant) => variant.sku === variantSku)
          ?.bc_calculated_price?.tax_inclusive || 0
      return `${currencyFormat(priceNumber)}`
    }

    const priceNumber =
      parseFloat(variants[0]?.bc_calculated_price?.tax_inclusive?.toString()) ||
      0
    return `${currencyFormat(priceNumber)}`
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

  const handleConfirmClicked = () => {
    handleSubmit((value) => {
      const optionsData = getOptionRequestData(formFields, {}, value)
      const optionList = Object.keys(optionsData).map((optionId) => ({
        optionId,
        optionValue: optionsData[optionId].toString(),
      }))

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
      loading={isLoading}
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
                    {getProductPrice(product)}
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
