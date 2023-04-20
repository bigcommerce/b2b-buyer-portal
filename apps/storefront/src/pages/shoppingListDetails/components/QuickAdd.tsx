import {
  useState,
  useEffect,
  KeyboardEventHandler,
  useContext,
} from 'react'

import {
  useForm,
} from 'react-hook-form'

import {
  Box,
  Typography,
  Grid,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  B3CustomForm,
  B3Sping,
  CustomButton,
} from '@/components'

import {
  snackbar,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getQuickAddRowFields,
} from '../shared/config'

import {
  SimpleObject,
  ShoppingListAddProductOption,
} from '../../../types'

import {
  getB2BVariantInfoBySkus,
  getBcVariantInfoBySkus,
} from '../../../shared/service/b2b'

interface AddToListContentProps {
  updateList: () => void,
  quickAddToList: (products: CustomFieldItems[]) => CustomFieldItems,
  level?: number,
  buttonText?: string,
}

export const QuickAdd = (props: AddToListContentProps) => {
  const {
    updateList,
    quickAddToList,
    level = 3,
    buttonText = 'Add product to list',
  } = props

  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const b3Lang = useB3Lang()

  const [rows, setRows] = useState(level)
  const [formFields, setFormFields] = useState<CustomFieldItems[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loopRows = (rows: number, fn:(index: number)=>void) => {
    new Array(rows).fill(1).forEach((item, index) => fn(index))
  }

  useEffect(() => {
    let formFields: CustomFieldItems[] = []
    loopRows(rows, (index) => {
      formFields = [...formFields, ...getQuickAddRowFields(index)]
    })
    setFormFields(formFields)
  }, [rows])

  const handleAddRowsClick = () => {
    setRows(rows + level)
  }

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setError,
    setValue,
  } = useForm({
    mode: 'all',
  })

  const validateSkuInput = (index: number, sku: string, qty: string) => {
    if (!sku && !qty) {
      return true
    }

    let isValid = true
    const quantity = parseInt(qty, 10) || 0

    if (!sku) {
      setError(`sku-${index}`, {
        type: 'manual',
        message: b3Lang('intl.global.validate.required', {
          label: 'SKU#',
        }),
      })
      isValid = false
    }

    if (!qty) {
      setError(`qty-${index}`, {
        type: 'manual',
        message: b3Lang('intl.global.validate.required', {
          label: 'Qty',
        }),
      })
      isValid = false
    } else if (quantity <= 0) {
      setError(`qty-${index}`, {
        type: 'manual',
        message: 'incorrect number',
      })
      isValid = false
    }

    return isValid
  }

  const getProductData = (value: CustomFieldItems) => {
    const skuValue: SimpleObject = {}
    let isValid = true
    loopRows(rows, (index) => {
      const sku = value[`sku-${index}`]
      const qty = value[`qty-${index}`]

      isValid = validateSkuInput(index, sku, qty) === false ? false : isValid

      if (isValid && sku) {
        const quantity = parseInt(qty, 10) || 0
        skuValue[sku] = skuValue[sku] ? (skuValue[sku] as number) + quantity : quantity
      }
    })

    return {
      skuValue,
      isValid,
      skus: Object.keys(skuValue),
    }
  }

  const getProductItems = (variantInfoList: CustomFieldItems, skuValue: SimpleObject, skus: string[]) => {
    const notFoundSku: string[] = []
    const notPurchaseSku: string[] = []
    const productItems: CustomFieldItems[] = []
    const passSku: string[] = []

    skus.forEach((sku) => {
      const variantInfo : CustomFieldItems | null = (variantInfoList || []).find((variant: CustomFieldItems) => variant.variantSku.toUpperCase() === sku.toUpperCase())

      if (!variantInfo) {
        notFoundSku.push(sku)
        return
      }

      const {
        productId,
        variantId,
        option: options,
        purchasingDisabled = '1',
      } = variantInfo

      const quantity = (skuValue[sku] as number) || 0

      if (purchasingDisabled === '1') {
        notPurchaseSku.push(sku)
        return
      }

      const optionList = (options || []).reduce((arr: ShoppingListAddProductOption[], optionStr: string) => {
        try {
          const option = typeof optionStr === 'string' ? JSON.parse(optionStr) : optionStr
          arr.push({
            optionId: `attribute[${option.option_id}]`,
            optionValue: `${option.id}`,
          })
          return arr
        } catch (error) {
          return arr
        }
      }, [])

      passSku.push(sku)

      productItems.push({
        ...variantInfo,
        newSelectOptionList: optionList,
        productId: parseInt(productId, 10) || 0,
        quantity,
        variantId: parseInt(variantId, 10) || 0,
      })
    })

    return {
      notFoundSku,
      notPurchaseSku,
      productItems,
      passSku,
    }
  }

  const showErrors = (value: CustomFieldItems, skus: string[], inputType: 'sku' | 'qty', message: string) => {
    skus.forEach((sku) => {
      const skuFieldName = Object.keys(value).find((name) => value[name] === sku) || ''

      if (skuFieldName) {
        setError(skuFieldName.replace('sku', inputType), {
          type: 'manual',
          message,
        })
      }
    })
  }

  const clearInputValue = (value: CustomFieldItems, skus: string[]) => {
    skus.forEach((sku) => {
      const skuFieldName = Object.keys(value).find((name) => value[name] === sku) || ''

      if (skuFieldName) {
        setValue(skuFieldName, '')
        setValue(skuFieldName.replace('sku', 'qty'), '')
      }
    })
  }

  const getVariantList = async (skus: string[]) => {
    const getVariantInfoBySku = isB2BUser ? getB2BVariantInfoBySkus : getBcVariantInfoBySkus

    try {
      const {
        variantSku: variantInfoList,
      }: CustomFieldItems = await getVariantInfoBySku({
        skus,
      }, true)

      return variantInfoList
    } catch (error) {
      return []
    }
  }

  const handleAddToList = () => {
    handleSubmit(async (value) => {
      try {
        setIsLoading(true)
        const {
          skuValue,
          isValid,
          skus,
        } = getProductData(value)

        if (!isValid || skus.length <= 0) {
          return
        }

        const variantInfoList = await getVariantList(skus)

        const {
          notFoundSku,
          notPurchaseSku,
          productItems,
          passSku,
        } = getProductItems(variantInfoList, skuValue, skus)

        if (notFoundSku.length > 0) {
          showErrors(value, notFoundSku, 'sku', '')
          snackbar.error(`SKU ${notFoundSku} were not found, please check entered values`, {
            isClose: true,
          })
        }

        if (notPurchaseSku.length > 0) {
          showErrors(value, notPurchaseSku, 'sku', '')
          snackbar.error(`SKU ${notPurchaseSku} no longer for sale`, {
            isClose: true,
          })
        }

        if (productItems.length > 0) {
          await quickAddToList(productItems)
          clearInputValue(value, passSku)

          updateList()
        }
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter') {
      handleAddToList()
    }
  }

  return (
    <B3Sping
      isSpinning={isLoading}
      spinningHeight="auto"
    >
      <Box>
        <Grid
          container
          sx={{
            margin: '16px 0',
          }}
        >
          <Grid
            item
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                color: '#000',
              }}
              variant="body1"
            >
              Quick add
            </Typography>
          </Grid>
          <Grid item>
            <CustomButton
              variant="text"
              sx={{
                textTransform: 'initial',
                ml: '-8px',
              }}
              onClick={handleAddRowsClick}
            >
              Show more rows
            </CustomButton>
          </Grid>
        </Grid>

        <Box
          onKeyDown={handleKeyDown}
          sx={{
            '& label': {
              zIndex: 0,
            },
          }}
        >
          <B3CustomForm
            formFields={formFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>

        <CustomButton
          variant="outlined"
          fullWidth
          disabled={isLoading}
          onClick={handleAddToList}
          sx={{
            margin: '20px 0',
          }}
        >
          <B3Sping
            isSpinning={isLoading}
            tip=""
            size={16}
          >
            <Box
              sx={{
                flex: 1,
                textAlign: 'center',
              }}
            >
              {buttonText}
            </Box>
          </B3Sping>
        </CustomButton>

      </Box>
    </B3Sping>
  )
}
