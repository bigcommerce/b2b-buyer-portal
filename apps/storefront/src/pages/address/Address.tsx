import {
  Box,
} from '@mui/material'

import {
  useEffect,
  useContext,
  useState,
  useRef,
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
} from '@/components/table/B3Table'
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
  getB2BCountries,
  getB2BAddress,
  getBCCustomerAddress,
  getB2BAddressConfig,
} from '@/shared/service/b2b'

import {
  filterFormConfig,
  convertBCToB2BAddress,
} from './shared/config'

import {
  CountryProps,
  getAddressFields,
} from './shared/getAddressFields'

import {
  AddressItemType,
  BCAddressItemType,
  AddressConfigItem,
} from '../../types/address'

import B3AddressForm from './components/AddressForm'

interface RefCurrntProps extends HTMLInputElement {
  handleOpenAddEditAddressClick: (type: string, data?: AddressItemType) => void
}

type BCAddress = {
  node: BCAddressItemType
}

const Address = () => {
  const {
    state: {
      role,
      isB2BUser,
      isAgenting,
      salesRepCompanyId,
      salesRepCompanyName,
      companyInfo: {
        id: companyInfoId,
        companyName: companyInfoName,
      },
      addressConfig,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const addEditAddressRef = useRef<RefCurrntProps | null>(null)

  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [addressList, setAddressList] = useState([])
  const [searchParams, setSearchParams] = useState({})
  const [addressFields, setAddressFields] = useState<CustomFieldItems[]>([])
  const [countries, setCountries] = useState<CountryProps[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    offset: 0,
    count: 0,
    first: 9,
  })

  const companyId = role === 3 && isAgenting ? salesRepCompanyId : companyInfoId
  const companyName = role === 3 && isAgenting ? salesRepCompanyName : companyInfoName
  const hasAdminPermission = isB2BUser && (!role || (role === 3 && isAgenting))
  const isBCPermission = !isB2BUser || (role === 3 && !isAgenting)

  const [isMobile] = useMobile()

  useEffect(() => {
    if (addressFields.length === 0) {
      const handleGetAddressFields = async () => {
        const {
          countries,
        } = await getB2BCountries()

        setCountries(countries)

        setIsRequestLoading(true)
        try {
          const addressFields = await getAddressFields(!isBCPermission, countries)
          setAddressFields(addressFields)
        } catch (err) {
          console.log(err)
        } finally {
          setIsRequestLoading(false)
        }
      }

      handleGetAddressFields()
    }
  }, [])

  const getAddressList = async (pagination: Pagination, params = {}) => {
    setIsRequestLoading(true)

    try {
      let list = []
      let {
        count,
      } = pagination

      if (!isBCPermission) {
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

  const getEditPermission = async () => {
    if (isBCPermission) {
      setEditPermission(true)
      return
    }
    if (hasAdminPermission) {
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

        const key = role === 3 ? 'address_sales_rep' : 'address_admin'

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

  const handleCreate = () => {
    if (!editPermission) {
      snackbar.error('You do not have permission to add new address, please contact store owner ')
      return
    }
    addEditAddressRef.current?.handleOpenAddEditAddressClick('add')
  }

  const handleEdit = (row: AddressItemType) => {
    if (!editPermission) {
      snackbar.error('You do not have permission to edit address, please contact store owner ')
      return
    }
    addEditAddressRef.current?.handleOpenAddEditAddressClick('edit', row)
  }

  const handleDelete = (address: AddressItemType) => {
    if (!editPermission) {
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
    isEnabled: editPermission,
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
              onEdit={() => handleEdit(row)}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              companyName={companyName}
              editPermission={editPermission}
              isBCPermission={isBCPermission}
            />
          )}
        />
        <B3AddressForm
          updateAddressList={updateAddressList}
          addressFields={addressFields}
          ref={addEditAddressRef}
          companyId={companyId}
          isBCPermission={isBCPermission}
          countries={countries}
        />
      </Box>

      {
        editPermission && !isBCPermission && (
          <SetDefaultDialog
            isOpen={isOpenSetDefault}
            setIsOpen={setIsOpenSetDefault}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
            companyId={companyId}
          />
        )
      }
      {
        editPermission && (
          <DeleteAddressDialog
            isOpen={isOpenDelete}
            setIsOpen={setIsOpenDelete}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
            companyId={companyId}
            isBCPermission={isBCPermission}
          />
        )
      }
    </B3Sping>
  )
}

export default Address
