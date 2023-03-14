// import {
//   distanceDay,
// } from '@/utils'

export interface FilterSearchProps {
  [key: string]: string | number | null
  beginDateAt: string | null
  endDateAt: string | null
  orderBy: string
  createdBy: string
  q: string
  companyName: string
  isShowMy: number
  companyId: string
}

export interface FilterMoreProps {
  startValue?: string
  endValue?: string
  PlacedBy?: string
  company?: string
  orderStatus?: string| number
}

const b2bFilterSearch:FilterSearchProps = {
  // offset: 0,
  // first: 10,
  q: '',
  companyId: '',
  beginDateAt: null,
  endDateAt: null,
  companyName: '',
  orderBy: '-createdAt',
  createdBy: '',
  orderNumber: '',
  poNumber: '',
  isShowMy: 0,
}

const bcFilterSearch = {
  // offset: 0,
  // first: 10,
  beginDateAt: null,
  endDateAt: null,
  orderBy: '-createdAt',
  createdBy: '',
  q: '',
}

export const getFilterMoreData = (isB2BUser:boolean, isCompanyOrder: boolean, orderStatuses = []) => {
  const newOrderStatuses = orderStatuses.filter((item: CustomFieldStringItems) => item.statusCode !== '0' && item.statusCode !== '1')
  const filterMoreList = [
    {
      name: 'company',
      label: 'Company',
      required: false,
      default: '',
      fieldType: 'text',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'orderStatus',
      label: 'Order status',
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: newOrderStatuses,
      replaceOptions: {
        label: 'customLabel',
        value: 'customLabel',
      },
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ]

  const filterCurrentMoreList = filterMoreList.filter((item) => {
    if (!isB2BUser && (item.name === 'company' || item.name === 'PlacedBy')) return false
    if (isB2BUser && !isCompanyOrder && item.name === 'company') return false
    return true
  })

  return filterCurrentMoreList
}

export const getInitFilter = (isCompanyOrder: boolean, isB2BUser: boolean): Partial<FilterSearchProps> => {
  if (isB2BUser) b2bFilterSearch.isShowMy = isCompanyOrder ? 0 : 1

  return isB2BUser ? b2bFilterSearch : bcFilterSearch
}

export const currencySymbol = (currencyItem: string) => {
  try {
    if (currencyItem) {
      const currencyToken = JSON.parse(JSON.parse(currencyItem))?.currency_token || ''

      return currencyToken
    }

    return ''
  } catch (e) {
    return ''
  }
}

export const getOrderStatusText = (status: number | string, getOrderStatuses: any) => getOrderStatuses.find((item: any) => item.systemLabel === status)?.customLabel || ''
