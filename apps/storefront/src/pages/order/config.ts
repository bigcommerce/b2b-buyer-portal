import { CustomerRole } from '@/types';
import { OrderStatusType } from '@/types/gql/graphql';

export interface FilterSearchProps {
  [key: string]: string | number | number[] | null;
  beginDateAt: string | null;
  endDateAt: string | null;
  orderBy: string;
  createdBy: string;
  q: string;
  companyName: string;
  isShowMy: number;
  companyId: string;
  companyIds: number[];
}

export const sortKeys = {
  orderId: 'bcOrderId',
  poNumber: 'poNumber',
  totalIncTax: 'totalIncTax',
  status: 'status',
  placedBy: 'placedBy',
  createdAt: 'createdAt',
};

export function assertSortKey(key: string): asserts key is keyof typeof sortKeys {
  if (!Object.keys(sortKeys).includes(key)) {
    throw new Error(`Invalid sort key: ${key}`);
  }
}

export const getFilterMoreData = (
  isB2BUser: boolean,
  role: string | number,
  isCompanyOrder: boolean,
  isAgenting: boolean,
  createdByUsers: any,
  orderStatuses: OrderStatusType[] = [],
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

  const filterCondition = isB2BUser && !(Number(role) === 3 && !isAgenting);
  const filterCurrentMoreList = filterMoreList.filter((item) => {
    if (
      (!isB2BUser || filterCondition) &&
      !isCompanyOrder &&
      (item.name === 'company' || item.name === 'PlacedBy')
    ) {
      return false;
    }

    if (Number(role) === 3 && !isAgenting && item.name === 'PlacedBy') {
      return false;
    }

    if (
      (isB2BUser || (Number(role) === CustomerRole.SUPER_ADMIN && isAgenting)) &&
      isCompanyOrder &&
      item.name === 'company'
    ) {
      return false;
    }

    return true;
  });

  return filterCurrentMoreList;
};

export const getCustomerInitFilter = (): Partial<FilterSearchProps> => ({
  beginDateAt: null,
  endDateAt: null,
  createdBy: '',
  q: '',
});

export const getCompanyInitFilter = (
  isCompanyOrder: boolean,
  companyId: number,
): Partial<FilterSearchProps> => ({
  companyId: '',
  beginDateAt: null,
  endDateAt: null,
  companyName: '',
  createdBy: '',
  orderNumber: '',
  poNumber: '',
  companyIds: [companyId],
  isShowMy: isCompanyOrder ? 0 : 1,
  q: '',
});

export const getOrderStatusText = (status: number | string, getOrderStatuses: any) =>
  getOrderStatuses.find((item: any) => item.systemLabel === status)?.customLabel || '';
