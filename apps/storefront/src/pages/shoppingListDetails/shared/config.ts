import {
  format,
} from 'date-fns'

import {
  ShoppingListProductItem,
  ShoppingListProductItemModifiers,
  ShoppingListProductItemModifiersOption,
  SimpleObject,
  ShoppingListSelectProductOption,
} from '../../../types'

export interface ShoppingListInfoProps {
  name: string;
  id: number | string;
  description: string;
  grandTotal: number | string;
  status: number | string;
  products: {
    totalCount: number | string;
  }
}

export interface CustomerInfoProps {
  email: string;
  firstName: string;
  lastName: string;
  userId: number | string;
}

export interface ProductInfoProps {
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

export interface ListItemProps {
  node: ProductInfoProps,
}

export interface CurrencyProps {
  is_default: boolean,
  currency_code: string,
  token: string,
}

export interface SearchProps {
  search: string,
  first?: number,
  offset?: number,
}

const fieldTypes: CustomFieldItems = {
  text: 'text',
  numbers_only_text: 'number',
  multi_line_text: 'multiline',
  date: 'date',
  checkbox: 'checkbox',
  radio_buttons: 'radio',
  dropdown: 'dropdown',
  rectangles: 'rectangle',
  file: 'files',
  swatch: 'swatch',
  product_list_with_images: 'productRadio',
}

export const Base64 = {
  encode(str: string | number | boolean) {
    return window.btoa(encodeURIComponent(str))
  },
  decode(str: string) {
    return decodeURIComponent(window.atob(str))
  },
}

const getFieldOptions = (fieldType: string, option: ShoppingListProductItemModifiers, productImages: SimpleObject) => {
  const {
    option_values: optionValues,
    id,
    config,
    display_name: displayName,
  } = option

  if (fieldType === 'text') {
    const {
      text_max_length: maxLength,
    } = config || {}

    return {
      maxLength: maxLength || undefined,
    }
  }

  if (fieldType === 'number') {
    const {
      number_lowest_value: lowest,
      number_limited: limitInput,
      number_highest_value: highest,
    } = config || {}
    return {
      min: limitInput ? (lowest || undefined) : undefined,
      max: limitInput ? (highest || undefined) : undefined,
      allowArrow: true,
    }
  }

  if (fieldType === 'multiline') {
    const {
      text_max_length: maxLength,
    } = config || {}
    return {
      rows: 3,
      maxLength: maxLength || undefined,
    }
  }

  if (fieldType === 'date') {
    const {
      default_value: defaultValue,
    } = config || {}

    return {
      default: defaultValue ? format(new Date(defaultValue), 'yyyy-MM-dd') : '',
    }
  }

  if (fieldType === 'checkbox') {
    const {
      checkbox_label: label,
      checked_by_default: checked,
    } = config || {}
    return {
      label: '',
      options: [{
        value: id,
        label,
      }],
      default: checked ? [id] : [],
    }
  }

  if (['radio', 'productRadio', 'rectangle', 'swatch'].includes(fieldType)) {
    const options = (optionValues || []).map((item: ShoppingListProductItemModifiersOption) => ({
      value: item.id,
      label: item.label,
      image: {
        data: productImages[item.value_data?.product_id || ''] || '',
        alt: '',
      },
      colors: item.value_data?.colors || [],
    }))
    const value = (optionValues || []).find((item: ShoppingListProductItemModifiersOption) => item.is_default)?.id || ''

    return {
      options,
      default: value,
    }
  }

  if (fieldType === 'dropdown') {
    return {
      options: optionValues,
      replaceOptions: {
        label: 'label',
        value: 'id',
      },
    }
  }

  if (fieldType === 'files') {
    const {
      file_max_size: fileSize,
    } = config || {}

    return {
      filesLimit: 1,
      maxFileSize: fileSize,
      default: [],
      title: displayName,
    }
  }
}

export const getProductOptionsFields = (product: ShoppingListProductItem, productImages: SimpleObject) => {
  const {
    allOptions = [],
  } = product || {}

  const list: CustomFieldItems[] = []
  allOptions.forEach((option: ShoppingListProductItemModifiers) => {
    const {
      type,
      id,
      display_name: displayName,
      required,
      config: {
        default_value: defaultValue,
      } = {},
      isVariantOption,
    } = option

    const fieldType = fieldTypes[type] || ''

    if (!fieldType) return

    const fieldOption = getFieldOptions(fieldType, option, productImages)

    let value = fieldOption?.default || defaultValue || ''

    try {
      const selectOptions = JSON.parse(product.selectOptions || '')
      if (fieldType !== 'date') {
        value = selectOptions.find((item: ShoppingListSelectProductOption) => item.option_id === `attribute[${id}]`)?.option_value || ''
      } else {
        const year = selectOptions.find((item: ShoppingListSelectProductOption) => item.option_id === `attribute[${id}][year]`)?.option_value || ''
        const month = selectOptions.find((item: ShoppingListSelectProductOption) => item.option_id === `attribute[${id}][month]`)?.option_value || ''
        const day = selectOptions.find((item: ShoppingListSelectProductOption) => item.option_id === `attribute[${id}][day]`)?.option_value || ''
        value = year && month && day ? `${year}-${month}-${day}` : value
      }
    } catch (err) {
      console.error(err)
    }

    if (fieldType === 'files') {
      value = value || []
    }

    list.push({
      name: Base64.encode(`attribute[${id}]`),
      label: displayName,
      required,
      xs: 12,
      variant: 'filled',
      size: 'small',
      fieldType,
      isVariantOption,
      ...fieldOption,
      default: value,
    })
  })

  return list
}

export const conversionProductsList = (products: ShoppingListProductItem[], listProduct: ListItemProps[] = []) => products.map((product) => {
  const optionsV3 = product.optionsV3 || []
  const modifiers = product.modifiers || []
  const variants = product.variants || []

  const variantOptions = optionsV3.map((option) => ({
    ...option,
    required: true,
    isVariantOption: true,
  }))

  let price = variants[0]?.calculated_price || 0
  variants.forEach((variant) => {
    price = Math.min(variant.calculated_price || 0, price)
  })

  const selectOptions = listProduct.find((item) => item.node.productId === product.id)?.node.optionList || '[]'

  return {
    ...product,
    quantity: 1,
    base_price: `${price}`,
    optionsV3,
    options: product.options || [],
    variants,
    modifiers,
    selectOptions,
    allOptions: [
      ...variantOptions,
      ...modifiers,
    ],
  }
})

export const getOptionRequestData = (formFields: CustomFieldItems[], requestData: CustomFieldItems, value: CustomFieldItems) => {
  formFields.forEach((item: CustomFieldItems) => {
    const {
      fieldType,
      name,
    } = item

    const decodeName = Base64.decode(name)
    const fieldValue = value[name]

    if (fieldType === 'files') {
      return
    }

    if (fieldType === 'number') {
      requestData[decodeName] = parseFloat(fieldValue)
      return
    }

    if (['radio', 'dropdown', 'rectangle', 'swatch', 'productRadio'].includes(fieldType)) {
      requestData[decodeName] = parseInt(fieldValue, 10)
      return
    }

    if (fieldType === 'checkbox') {
      requestData[decodeName] = fieldValue?.length > 0 ? fieldValue[0] : ''
      return
    }

    if (fieldType === 'date') {
      if (!fieldValue) {
        return
      }

      const date = new Date(fieldValue)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()

      requestData[`${decodeName}[year]`] = year
      requestData[`${decodeName}[month]`] = month
      requestData[`${decodeName}[day]`] = day
      return
    }

    requestData[decodeName] = fieldValue
  })

  return requestData
}

export const getQuickAddRowFields = (name: string | number) => [
  {
    name: `sku-${name}`,
    label: 'SKU#',
    required: false,
    xs: 8,
    variant: 'filled',
    size: 'small',
    fieldType: 'text',
    default: '',
  }, {
    name: `qty-${name}`,
    label: 'Qty',
    required: false,
    xs: 4,
    variant: 'filled',
    size: 'small',
    fieldType: 'number',
    default: '',
    allowArrow: true,
  },
]
