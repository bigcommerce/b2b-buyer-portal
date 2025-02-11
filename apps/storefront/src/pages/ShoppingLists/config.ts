import { LangFormatFunction, useB3Lang } from '@b3/lang';

import { CompanyInfoTypes } from '@/types';

export interface ShoppingListSearch {
  search?: string;
  createdBy?: string;
  status?: string | number | number[];
  offset?: number;
  first?: number;
}

interface ShoppingListStatusProps {
  label: string;
  value: number | string;
  idLang: string;
}

interface ShoppingListsItemsCustomerInfoProps {
  firstName: string;
  lastName: string;
  userId: number;
  email: string;
  role: string;
}

export interface ShoppingListsItemsProps {
  id?: number;
  name: string;
  description: string;
  status: number;
  customerInfo: ShoppingListsItemsCustomerInfoProps;
  products: {
    totalCount: number;
  };
  updatedAt: string | number;
  sampleShoppingListId?: number | string;
  channelId: number;
  approvedFlag: boolean;
  isOwner: boolean;
  companyInfo: CompanyInfoTypes | null;
  companyId?: number;
}

export interface GetFilterMoreListProps {
  options?: Array<ShoppingListStatusProps>;
  rows?: string | number;
  name: string;
  label: string;
  required: boolean;
  default: string;
  fieldType: string;
  xs: number;
  variant: string;
  size: string;
  maxLength?: number;
  idLang?: string;
}

export const useGetFilterShoppingListStatus = () => {
  const b3Lang = useB3Lang();

  return (submitShoppingListPermission: boolean) => {
    const draftStatus = { value: 30, label: b3Lang('global.shoppingLists.status.draft') };
    const rejectedStatus = { value: 20, label: b3Lang('global.shoppingLists.status.rejected') };

    const shoppingListStatus = [
      { value: 99, label: b3Lang('global.shoppingLists.status.all') },
      { value: 0, label: b3Lang('global.shoppingLists.status.approved') },
      ...(submitShoppingListPermission ? [draftStatus] : []),
      { value: 40, label: b3Lang('global.shoppingLists.status.readyForApproval') },
      ...(submitShoppingListPermission ? [rejectedStatus] : []),
    ];

    return shoppingListStatus;
  };
};

interface CreatedByUsers {
  createdByUser?: {
    results: Array<{ firstName: string; lastName: string; email: string }>;
  };
}

interface BaseFilter {
  label: string;
  required: boolean;
  default: string;
  fieldType: string;
  xs: number;
  variant: string;
  size: string;
  idLang: string;
}

interface CreatedByFilter extends BaseFilter {
  name: 'createdBy';
  options: Array<{ createdBy: string }>;
  replaceOptions: { label: string; value: string };
}

interface StatusFilter extends BaseFilter {
  name: 'status';
  options: Array<{ label: string; value: number }>;
}

export const useGetFilterMoreList = () => {
  const getFilterShoppingListStatus = useGetFilterShoppingListStatus();

  return (
    submitShoppingListPermission: boolean,
    createdByUsers: CreatedByUsers,
  ): Array<CreatedByFilter | StatusFilter> => {
    const newCreatedByUsers =
      createdByUsers?.createdByUser?.results.map((item) => ({
        createdBy: `${item.firstName} ${item.lastName} (${item.email})`,
      })) || [];
    const filterMoreList = [
      {
        name: 'createdBy' as const,
        label: 'Created by',
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
        idLang: 'global.shoppingLists.filter.createdBy',
      },
      {
        name: 'status' as const,
        label: 'Status',
        required: false,
        default: '',
        fieldType: 'dropdown',
        options: getFilterShoppingListStatus(submitShoppingListPermission),
        xs: 12,
        variant: 'filled',
        size: 'small',
        idLang: 'global.shoppingLists.filter.status',
      },
    ];

    return filterMoreList;
  };
};

export const getCreatedShoppingListFiles = (
  b3Lang: LangFormatFunction,
): GetFilterMoreListProps[] => [
  {
    name: 'name',
    label: b3Lang('shoppingLists.name'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    maxLength: 200,
  },
  {
    name: 'description',
    label: b3Lang('shoppingLists.description'),
    required: false,
    default: '',
    fieldType: 'multiline',
    xs: 12,
    variant: 'filled',
    size: 'small',
    rows: 4,
    maxLength: 200,
  },
];
