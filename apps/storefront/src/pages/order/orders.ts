import B3Request from '@/shared/service/request/b3Fetch';
import { OrderStatusItem } from '@/types';
import { convertArrayToGraphql } from '@/utils/graphqlDataConvert';

export interface CustomerOrderNode {
  node: {
    orderId?: string;
    createdAt: number;
    totalIncTax?: number;
    money?: string;
    poNumber?: string;
    status: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface GetCustomerOrders {
  data: {
    customerOrders: {
      totalCount: number;
      edges: CustomerOrderNode[];
    };
  };
}

export interface CompanyOrderNode {
  node: {
    orderId?: string;
    createdAt: number;
    totalIncTax?: number;
    money?: string;
    poNumber?: string;
    status: string;
    firstName?: string;
    lastName?: string;
    companyInfo?: {
      companyName: string;
    };
  };
}

export interface GetCompanyOrders {
  data: {
    allOrders: {
      totalCount: number;
      edges: CustomerOrderNode[];
    };
  };
}

const allOrders = (data: CustomFieldItems, fn: 'allOrders' | 'customerOrders') => `
query ${fn === 'allOrders' ? 'GetAllOrders' : 'GetCustomerOrders'} {
  ${fn}(
    search: "${data.q || ''}"
    status: "${data.statusCode || ''}"
    first: ${data.first}
    offset: ${data.offset}
    beginDateAt: ${data.beginDateAt ? JSON.stringify(data.beginDateAt) : null}
    endDateAt: ${data.endDateAt ? JSON.stringify(data.endDateAt) : null}
    companyName: "${data.companyName || ''}"
    createdBy: "${data.createdBy || ''}"
    isShowMy: "${data.isShowMy || 0}"
    orderBy: "${data.orderBy}"
    email: "${data.email || ''}"
    ${data.companyIds ? `companyIds: ${convertArrayToGraphql(data.companyIds || [])}` : ''}
  ){
    totalCount,
    edges{
      node {
        orderId,
        createdAt,
        totalIncTax,
        money,
        poNumber,
        status,
        firstName,
        lastName,
        companyInfo {
          companyName,
        }
      }
    }
  }
}`;

export interface OrderStatus {
  systemLabel: string;
  customLabel: string;
  statusCode: string;
}

export interface CustomerOrderStatues {
  data: {
    bcOrderStatuses: OrderStatus[];
  };
}

export interface CompanyOrderStatuses {
  data: {
    orderStatuses: OrderStatus[];
  };
}

const getOrderStatusTypeQl = (fn: 'orderStatuses' | 'bcOrderStatuses') => `
query ${fn === 'orderStatuses' ? 'GetOrderStatuses' : 'GetCustomerOrderStatuses'} {
  ${fn} {
    systemLabel,
    customLabel,
    statusCode,
  }
}`;

const getCreatedByUser = (companyId: number) => `
  query GetOrdersCreatedByUser {
    createdByUser (
      companyId: ${companyId},
      module: 0,
    ){
      results,
    }
  }
`;

export const getB2BAllOrders = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: allOrders(data, 'allOrders'),
  }).then((res) => res.allOrders);

export const getBCAllOrders = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: allOrders(data, 'customerOrders'),
  }).then((res) => res.customerOrders);

export const getOrderStatusType = (): Promise<OrderStatusItem[]> =>
  B3Request.graphqlB2B({
    query: getOrderStatusTypeQl('orderStatuses'),
  }).then((res) => res.orderStatuses);

export const getBcOrderStatusType = (): Promise<OrderStatusItem[]> =>
  B3Request.graphqlB2B({
    query: getOrderStatusTypeQl('bcOrderStatuses'),
  }).then((res) => res.bcOrderStatuses);

export const getOrdersCreatedByUser = (companyId: number) =>
  B3Request.graphqlB2B({
    query: getCreatedByUser(companyId),
  });
