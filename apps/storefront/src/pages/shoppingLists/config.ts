export interface ShoppingListSearch {
  search?: string;
  createdBy?: string;
  status?: string | number | number[],
  offset?: number;
  first?: number;
}

interface ShoppingListStatusProps {
  label: string
  value: number | string
}

interface ShoppingListsItemsCustomerInfoProps {
  firstName: string
  lastName: string
  userId: number
  email: string
  role: string
}

export interface ShoppingListsItemsProps {
  id?: number
  name: string
  description: string
  status: number
  customerInfo: ShoppingListsItemsCustomerInfoProps
  products: {
    totalCount: number
  }
  updatedAt: string | number,
  sampleShoppingListId?: number | string
  channelId: number
}

export interface GetFilterMoreListProps {
  options?: Array<ShoppingListStatusProps>
  rows?: string | number,
  name: string
  label: string
  required: boolean
  default: string
  fieldType: string
  xs: number
  variant: string
  size: string
  maxLength?: number
}

export const getFilterShoppingListStatus = (role?: number | string): Array<ShoppingListStatusProps> => {
  const shoppingListStatus: Array<ShoppingListStatusProps> = [
    {
      label: 'All',
      value: 99,
    },
    {
      label: 'Approved',
      value: 0,
    },
    {
      label: 'Draft',
      value: 30,
    },
    {
      label: 'Ready for approval',
      value: 40,
    },
    {
      label: 'Rejected',
      value: 20,
    },
  ]

  const getShoppingListStatus = role !== 2 ? shoppingListStatus.filter((item: ShoppingListStatusProps) => (item.value !== 30 && item.value !== 20)) : shoppingListStatus

  return getShoppingListStatus
}

export const getFilterMoreList = (role: number | string): GetFilterMoreListProps[] => {
  const filterMoreList = [
    {
      name: 'createdBy',
      label: 'Created by',
      required: false,
      default: '',
      fieldType: 'text',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'status',
      label: 'Status',
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: getFilterShoppingListStatus(role),
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ]

  return filterMoreList
}

export const getCreatedShoppingListFiles = (): GetFilterMoreListProps[] => [
  {
    name: 'name',
    label: 'Name',
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
    label: 'Description',
    required: false,
    default: '',
    fieldType: 'multiline',
    xs: 12,
    variant: 'filled',
    size: 'small',
    rows: 4,
    maxLength: 200,
  },
]
