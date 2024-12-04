import { CustomerRole } from '@/types';
import { OrderStatusType } from '@/types/gql/graphql';

export interface FilterSearchProps {
  [key: string]: string | number | null;
  beginDateAt: string | null;
  endDateAt: string | null;
  orderBy: string;
  createdBy: string;
  q: string;
  companyName: string;
  isShowMy: number;
  companyId: string | number;
}

export interface FilterMoreProps {
  startValue?: string;
  endValue?: string;
  PlacedBy?: string;
  company?: string;
  orderStatus?: string | number;
}

export const defaultSortKey = 'orderId';

export const sortKeys = {
  orderId: 'bcOrderId',
  poNumber: 'poNumber',
  totalIncTax: 'totalIncTax',
  status: 'status',
  placedby: 'placedBy',
  createdAt: 'createdAt',
};

const b2bFilterSearch: FilterSearchProps = {
  q: '',
  companyId: '',
  beginDateAt: null,
  endDateAt: null,
  companyName: '',
  orderBy: `-${sortKeys[defaultSortKey]}`,
  createdBy: '',
  orderNumber: '',
  poNumber: '',
  isShowMy: 0,
};

const bcFilterSearch = {
  beginDateAt: null,
  endDateAt: null,
  orderBy: `-${sortKeys[defaultSortKey]}`,
  createdBy: '',
  q: '',
};

export const getFilterMoreData = (
  isB2BUser: boolean,
  role: string | number,
  isCompanyOrder: boolean,
  isAgenting: boolean,
  createdByUsers: any,
  orderStatuses: OrderStatusType[] = [],
  orderSubPermission: boolean = false,
) => {
  const newOrderStatuses = orderStatuses.filter(
    (item) => item.statusCode !== '0' && item.statusCode !== '1',
  );
  const newCreatedByUsers =
    createdByUsers?.createdByUser?.results.map((item: any) => ({
      createdBy: `${item.firstName} ${item.lastName} (${item.email})`,
    })) || [];
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
      idLang: 'orders.company',
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
      idLang: 'orders.orderStatus',
    },
    {
      name: 'PlacedBy',
      label: 'Placed by',
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: newCreatedByUsers,
      replaceOptions: {
        label: 'createdBy',
        value: 'createdBy',
      },
      xs: 12,
      variant: 'filled',
      size: 'small',
      idLang: 'orders.placedBy',
    },
  ];

  if (orderSubPermission) {
    filterMoreList.push({
      name: 'companyId',
      label: 'Company',
      required: false,
      default: '',
      fieldType: 'companyAutocomplete',
      xs: 12,
      variant: 'filled',
      size: 'small',
      idLang: 'orders.company',
    });
  }

  const filterCondition = isB2BUser && !(+role === 3 && !isAgenting);
  const filterCurrentMoreList = filterMoreList.filter((item) => {
    if (
      (!isB2BUser || filterCondition) &&
      !isCompanyOrder &&
      (item.name === 'company' || item.name === 'PlacedBy')
    )
      return false;
    if (+role === 3 && !isAgenting && item.name === 'PlacedBy') return false;
    if (
      (isB2BUser || (+role === CustomerRole.SUPER_ADMIN && isAgenting)) &&
      isCompanyOrder &&
      item.name === 'company'
    )
      return false;
    return true;
  });

  return filterCurrentMoreList;
};

export const getInitFilter = (
  isCompanyOrder: boolean,
  isB2BUser: boolean,
): Partial<FilterSearchProps> => {
  if (isB2BUser) b2bFilterSearch.isShowMy = isCompanyOrder ? 0 : 1;

  return isB2BUser ? b2bFilterSearch : bcFilterSearch;
};

export const currencySymbol = (currencyItem: string) => {
  try {
    if (currencyItem) {
      const currencyToken = JSON.parse(JSON.parse(currencyItem))?.currency_token || '';

      return currencyToken;
    }

    return '';
  } catch (e) {
    return '';
  }
};

export const getOrderStatusText = (status: number | string, getOrderStatuses: any) =>
  getOrderStatuses.find((item: any) => item.systemLabel === status)?.customLabel || '';
