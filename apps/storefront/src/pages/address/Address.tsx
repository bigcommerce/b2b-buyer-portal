import {
  Box,
  Typography,
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
  SetDefaultDialog,
} from './components/SetDefaultDialog'
import {
  DeleteAddressDialog,
} from './components/DeleteAddressDialog '
import {
  Pagination,
  B3Table,
} from '@/components/B3Table'
import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  B3TipsDialog,
} from '@/components/B3TipsDialog'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getB2BCustomerAddress,
} from '@/shared/service/b2b'

import {
  filterFormConfig,
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
    first: 10,
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

  const updateAddressList = (isFirst: boolean = true) => {
    getAddressList({
      ...pagination,
      offset: isFirst ? 0 : pagination.offset,
    }, searchParams)
  }

  const [editPermission, setEditPermission] = useState(true)
  const [isOpenPermission, setIsOpenPermission] = useState(false)
  const [isOpenSetDefault, setIsOpenSetDefault] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<AddressItemType>()

  const isAdmin = !isB2BUser || !role || role === 3

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

  const handleDelete = (address: AddressItemType) => {
    if (!checkPermission()) {
      return
    }
    setCurrentAddress({
      ...address,
    })
    setIsOpenDelete(true)
  }

  const handleSetDefault = (address: AddressItemType) => {
    setCurrentAddress({
      ...address,
    })
    setIsOpenSetDefault(true)
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
          rowsPerPageOptions={[9, 18, 36]}
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

      <B3TipsDialog
        isOpen={isOpenPermission}
        setIsOpen={setIsOpenPermission}
        type="error"
      >
        <Typography
          variant="body2"
          align="center"
          sx={{
            marginTop: '2em',
            marginBottom: '1em',
          }}
        >
          Address add has been disabled by the system administrators
        </Typography>
      </B3TipsDialog>

      <SetDefaultDialog
        isOpen={isOpenSetDefault}
        setIsOpen={setIsOpenSetDefault}
        addressData={currentAddress}
        updateAddressList={updateAddressList}
      />

      <DeleteAddressDialog
        isOpen={isOpenDelete}
        setIsOpen={setIsOpenDelete}
        addressData={currentAddress}
        updateAddressList={updateAddressList}
      />
    </B3Sping>
  )
}

export default Address
