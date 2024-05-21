import { LangFormatFunction } from '@b3/lang';

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

export const getFilterShoppingListStatus = (
  submitShoppingListPermission: boolean,
): Array<ShoppingListStatusProps> => {
  const shoppingListStatus: Array<ShoppingListStatusProps> = [
    {
      label: 'All',
      value: 99,
      idLang: 'global.shoppingLists.status.all',
    },
    {
      label: 'Approved',
      value: 0,
      idLang: 'global.shoppingLists.status.approved',
    },
    {
      label: 'Draft',
      value: 30,
      idLang: 'global.shoppingLists.status.draft',
    },
    {
      label: 'Ready for approval',
      value: 40,
      idLang: 'global.shoppingLists.status.readyForApproval',
    },
    {
      label: 'Rejected',
      value: 20,
      idLang: 'global.shoppingLists.status.rejected',
    },
  ];

  const getShoppingListStatus = !submitShoppingListPermission
    ? shoppingListStatus.filter(
        (item: ShoppingListStatusProps) => item.value !== 30 && item.value !== 20,
      )
    : shoppingListStatus;

  return getShoppingListStatus;
};

export const getFilterMoreList = (
  createdByUsers: any,
  submitShoppingListPermission: boolean,
): GetFilterMoreListProps[] => {
  const newCreatedByUsers =
    createdByUsers?.createdByUser?.results.map((item: any) => ({
      createdBy: `${item.firstName} ${item.lastName} (${item.email})`,
    })) || [];
  const filterMoreList = [
    {
      name: 'createdBy',
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
      name: 'status',
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
