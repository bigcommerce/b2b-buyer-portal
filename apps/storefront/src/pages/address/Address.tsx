import {
  Box, Button,
} from '@mui/material'

import {
  useEffect,
  useContext,
  useState,
} from 'react'

import {
  useMobile,
} from '@/hooks'

import B3Filter from '../../components/filter/B3Filter'
import {
  AddressItemCard,
} from './components/AddressItemCard'
import {
  Pagination,
  B3Table,
} from '@/components/B3Table'
import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getB2BCustomerAddress,
} from '@/shared/service/b2b'

import {
  filterFormConfig,
  filterSortConfig,
  filterPickerConfig,
} from './shared/config'

import {
  AddressItemType,
} from '../../types/address'

const Address = () => {
  const {
    state: {
      role,
      isB2BUser,
      companyInfo: {
        id: companyId,
      },
    },
  } = useContext(GlobaledContext)

  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [addressList, setAddressList] = useState([])
  const [searchParams, setSearchParams] = useState({})
  const [pagination, setPagination] = useState<Pagination>({
    offset: 0,
    count: 0,
    first: 1,
  })

  const [isMobile] = useMobile()

  const getAddressList = async (pagination: Pagination, params = {}) => {
    setIsRequestLoading(true)

    try {
      const addressKey = isB2BUser ? 'addresses' : 'customerAddresses'
      const {
        [addressKey]: {
          edges: list = [],
          totalCount,
        },
      }: CustomFieldItems = await getB2BCustomerAddress({
        companyId,
        ...params,
        ...pagination,
      })

      if (isMobile) {
        const newList = pagination.offset > 0 ? [...addressList, ...list] : list
        setAddressList(newList)
      } else {
        setAddressList(list)
      }

      setPagination({
        ...pagination,
        count: totalCount,
      })
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      const params = {
        ...searchParams,
        search: value,
      }

      setSearchParams(params)
      getAddressList({
        ...pagination,
        offset: 0,
      }, params)
    }
  }
  const handleFilterChange = (values: {[key: string]: string | number | Date}) => {
    const params = {
      ...searchParams,
      country: values.country || '',
      state: values.state || '',
      city: values.city || '',
    }
    setSearchParams(params)
    getAddressList({
      ...pagination,
      offset: 0,
    }, params)
  }

  const handlePaginationChange = (pagination: Pagination) => {
    setPagination(pagination)
    getAddressList(pagination, searchParams)
  }

  const [editPermission, setEditPermission] = useState(false)
  const [isOpenPermission, setIsOpenPermission] = useState(false)
  const isAdmin = !role || role === 3

  const getEditPermission = () => {
    if (isAdmin) {
      // TODO get config
    }
  }

  useEffect(() => {
    getEditPermission()
  }, [])

  const checkPermission = () => {
    if (!isAdmin) {
      return false
    }
    if (!editPermission) {
      setIsOpenPermission(true)
      return false
    }
    return true
  }

  const handleCreate = () => {
    if (!checkPermission()) {
      return
    }
    // TODO show create modal
    console.log('create')
  }

  const handleEdit = () => {
    if (!checkPermission()) {
      return
    }
    // TODO show edit modal
    console.log('edit')
  }

  const handleDelete = () => {
    if (!checkPermission()) {
      return
    }
    // TODO show delete modal
    console.log('delete')
  }

  const handleSetDefault = () => {
    // TODO show delete modal
    console.log('setDefault')
  }

  const AddButtonConfig = {
    isEnabled: isAdmin,
    customLabel: 'Add new address',
  }

  return (
    <B3Sping
      isSpinning={isRequestLoading}
    >
      <Box sx={{
        flex: 1,
      }}
      >
        <B3Filter
          startPicker={filterPickerConfig}
          endPicker={filterPickerConfig}
          sortByConfig={filterSortConfig}
          fiterMoreInfo={filterFormConfig}
          handleChange={handleChange}
          handleFilterChange={handleFilterChange}
          customButtomConfig={AddButtonConfig}
          handleFilterCustomButtomClick={handleCreate}
        />
        <B3Table
          columnItems={[]}
          listItems={addressList}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isCustomRender
          isInfiniteScroll={isMobile}
          isLoading={isRequestLoading}
          renderItem={(row: AddressItemType) => (
            <AddressItemCard
              key={row.id}
              item={row}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          )}
        />
      </Box>
    </B3Sping>
  )
}

export default Address
