export interface ShippingListSearch {
  search?: String;
  createdBy?: String;
  status?: String;
  offset?: number;
  first?: number;
}

interface ShippingListStatusProps {
  label: string
  value: number
}

interface ShippingListsItemsCustomerInfoProps {
  firstName: string
  lastName: string
  userId: number
  email: string
}

export interface ShippingListsItemsProps {
  id?: number
  name: string
  description: string
  status: number
  customerInfo: ShippingListsItemsCustomerInfoProps
  products: {
    totalCount: number
  }
  sampleShoppingListId?: number | string
}

export interface GetFilterMoreListProps {
  options?: Array<ShippingListStatusProps>
  rows?: string | number,
  name: string
  label: string
  required: boolean
  default: string
  fieldType: string
  xs: number
  variant: string
  size: string
}

export const getFilterShippingListStatus = (role?: number | string): Array<ShippingListStatusProps> => {
  const shippingListStatus: Array<ShippingListStatusProps> = [
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
      value: 50,
    },
  ]

  const getShippingListStatus = role !== 2 ? shippingListStatus.filter((item: ShippingListStatusProps) => (item.value !== 30 && item.value !== 50)) : shippingListStatus

  return getShippingListStatus
}

export const getFilterMoreList = (role: number | string): GetFilterMoreListProps[] => {
  const filterMoreList = [
    {
      name: 'createdBy',
      label: 'CreatedBy',
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
      options: getFilterShippingListStatus(role),
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ]

  return filterMoreList
}

export const getCreatedShippingListFiles = (): GetFilterMoreListProps[] => [
  {
    name: 'name',
    label: 'Name',
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
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
  },
]
