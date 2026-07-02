import type { Order as SfGqlOrder } from '@/shared/service/bc/graphql/orders';
import type { CompanyInfoTypes } from '@/types/invoice';

export interface ListItem {
  firstName: string;
  lastName: string;
  orderId: string;
  poNumber?: string;
  money?: string;
  /** Pre-formatted grand total in the order's own currency, from SF GQL Money.formattedV2. */
  formattedTotalIncTax?: string;
  totalIncTax: string;
  status: string;
  statusText?: string;
  createdAt: string;
  companyName: string;
  companyInfo?: CompanyInfoTypes;
  /** Cursor from the SF GQL edge — populated for unified order paths only. */
  cursor?: string;
}

export const mapSfGqlOrderToListItem = (order: SfGqlOrder, cursor?: string): ListItem => ({
  orderId: String(order.entityId),
  poNumber: order.poNumber || '',
  totalIncTax: String(order.totalIncTax.value),
  formattedTotalIncTax: order.totalIncTax.formattedV2,
  status: order.status.label,
  statusText: order.status.label,
  createdAt: String(Math.floor(new Date(order.orderedAt.utc).getTime() / 1000)),
  firstName: order.placedBy?.firstName || '',
  lastName: order.placedBy?.lastName || '',
  companyName: order.company?.name || '',
  companyInfo: order.company
    ? {
        companyName: order.company.name,
        companyId: String(order.company.entityId),
        companyAddress: '',
        companyCountry: '',
        companyState: '',
        companyCity: '',
        companyZipCode: '',
        phoneNumber: '',
        bcId: '',
      }
    : undefined,
  money: '',
  cursor,
});
