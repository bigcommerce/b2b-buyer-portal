import {
  Box,
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
  GlobaledContext,
} from '@/shared/global'

import {
  snackbar,
} from '@/utils'

import {
  getB2BAddress,
  getBCCustomerAddress,
  getB2BAddressConfig,
} from '@/shared/service/b2b'

import {
  filterFormConfig,
  convertBCToB2BAddress,
} from './shared/config'

import {
  AddressItemType,
  BCAddressItemType,
  AddressConfigItem,
} from '../../types/address'

type BCAddress = {
  node: BCAddressItemType
}

const Address = () => {
  const {
    state: {
      role,
      isB2BUser,
      companyInfo: {
        id: companyId,
      },
      addressConfig,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [addressList, setAddressList] = useState([])
  const [searchParams, setSearchParams] = useState({})
  const [pagination, setPagination] = useState<Pagination>({
    offset: 0,
    count: 0,
    first: 9,
  })

  const [isMobile] = useMobile()

  const getAddressList = async (pagination: Pagination, params = {}) => {
    setIsRequestLoading(true)

    try {
      let list = []
      let {
        count,
      } = pagination

      if (isB2BUser) {
        const {
          addresses: {
            edges: addressList = [],
            totalCount,
          },
        }: CustomFieldItems = await getB2BAddress({
          companyId,
          ...params,
          ...pagination,
        })

        list = addressList
        count = totalCount
      } else {
        const {
          customerAddresses: {
            edges: addressList = [],
            totalCount,
          },
        }: CustomFieldItems = await getBCCustomerAddress({
          ...params,
          ...pagination,
        })

        list = addressList.map((address: BCAddress) => ({
          node: convertBCToB2BAddress(address.node),
        }))
        count = totalCount
      }

      if (isMobile) {
        const newList = pagination.offset > 0 ? [...addressList, ...list] : list
        setAddressList(newList)
      } else {
        setAddressList(list)
      }

      setPagination({
        ...pagination,
        count,
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

  const [editPermission, setEditPermission] = useState(false)
  const [isOpenSetDefault, setIsOpenSetDefault] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<AddressItemType>()

  const isAdmin = !isB2BUser || !role || role === 3

  const getEditPermission = async () => {
    if (!isB2BUser) {
      setEditPermission(true)
      return
    }
    if (!role || role === 3) {
      try {
        let configList = addressConfig
        if (!configList) {
          const {
            addressConfig: newConfig,
          }: CustomFieldItems = await getB2BAddressConfig()
          configList = newConfig

          dispatch({
            type: 'common',
            payload: {
              addressConfig: configList,
            },
          })
        }

        const key = !role ? 'address_admin' : 'address_sales_rep'

        const editPermission = (configList || []).find((config: AddressConfigItem) => config.key === key)?.isEnabled === '1'
        setEditPermission(editPermission)
      } catch (error) {
        console.error(error)
      }
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
      return false
    }
    return true
  }

  const handleCreate = () => {
    if (!checkPermission()) {
      snackbar.error('You do not have permission to add new address, please contact store owner ')
      return
    }
    // TODO show create modal
    console.log('create')
  }

  const handleEdit = () => {
    if (!checkPermission()) {
      snackbar.error('You do not have permission to edit address, please contact store owner ')
      return
    }
    // TODO show edit modal
    console.log('edit')
  }

  const handleDelete = (address: AddressItemType) => {
    if (!checkPermission()) {
      snackbar.error('You do not have permission to delete address, please contact store owner ')
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
          rowsPerPageOptions={[9, 18, 27]}
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

      {
        isAdmin && isB2BUser && (
        <SetDefaultDialog
          isOpen={isOpenSetDefault}
          setIsOpen={setIsOpenSetDefault}
          setIsLoading={setIsRequestLoading}
          addressData={currentAddress}
          updateAddressList={updateAddressList}
        />
        )
      }
      {
        isAdmin && (
          <DeleteAddressDialog
            isOpen={isOpenDelete}
            setIsOpen={setIsOpenDelete}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
          />
        )
      }
    </B3Sping>
  )
}

export default Address
