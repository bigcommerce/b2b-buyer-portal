import { useContext, useEffect, useRef, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import { B3Sping } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { useCardListColumn, useTableRef } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  getB2BAddress,
  getB2BAddressConfig,
  getB2BCountries,
  getBCCustomerAddress,
} from '@/shared/service/b2b'
import { snackbar } from '@/utils'

import B3Filter from '../../components/filter/B3Filter'
import {
  AddressConfigItem,
  AddressItemType,
  BCAddressItemType,
} from '../../types/address'

import B3AddressForm from './components/AddressForm'
import { AddressItemCard } from './components/AddressItemCard'
import DeleteAddressDialog from './components/DeleteAddressDialog'
import SetDefaultDialog from './components/SetDefaultDialog'
import { convertBCToB2BAddress, filterFormConfig } from './shared/config'
import { CountryProps, getAddressFields } from './shared/getAddressFields'

interface RefCurrntProps extends HTMLInputElement {
  handleOpenAddEditAddressClick: (type: string, data?: AddressItemType) => void
}

type BCAddress = {
  node: BCAddressItemType
}

interface FilterSearchProps {
  country?: string
  state?: string
  city?: string
  search?: string
}

function Address() {
  const {
    state: {
      role,
      isB2BUser,
      isAgenting,
      salesRepCompanyId,
      companyInfo: { id: companyInfoId },
      addressConfig,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const b3Lang = useB3Lang()

  const isExtraLarge = useCardListColumn()
  const [paginationTableRef] = useTableRef()

  const addEditAddressRef = useRef<RefCurrntProps | null>(null)

  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [addressFields, setAddressFields] = useState<CustomFieldItems[]>([])
  const [countries, setCountries] = useState<CountryProps[]>([])
  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>({
    search: '',
  })

  const companyId = role === 3 && isAgenting ? salesRepCompanyId : companyInfoId
  const hasAdminPermission = isB2BUser && (!role || (role === 3 && isAgenting))
  const isBCPermission = !isB2BUser || (role === 3 && !isAgenting)

  useEffect(() => {
    if (addressFields.length === 0) {
      const handleGetAddressFields = async () => {
        const { countries } = await getB2BCountries()

        setCountries(countries)

        setIsRequestLoading(true)
        try {
          const addressFields = await getAddressFields(
            !isBCPermission,
            countries
          )
          setAddressFields(addressFields || [])
        } catch (err) {
          console.log(err)
        } finally {
          setIsRequestLoading(false)
        }
      }

      handleGetAddressFields()
    }
  }, [])

  const getAddressList = async (params = {}) => {
    let list = []
    let count = 0

    if (!isBCPermission) {
      const {
        addresses: { edges: addressList = [], totalCount },
      }: CustomFieldItems = await getB2BAddress({
        companyId,
        ...params,
      })

      list = addressList
      count = totalCount
    } else {
      const {
        customerAddresses: { edges: addressList = [], totalCount },
      }: CustomFieldItems = await getBCCustomerAddress({
        ...params,
      })

      list = addressList.map((address: BCAddress) => ({
        node: convertBCToB2BAddress(address.node),
      }))
      count = totalCount
    }

    return {
      edges: list,
      totalCount: count,
    }
  }

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        search: value,
      })
    }
  }
  const handleFilterChange = (values: FilterSearchProps) => {
    setFilterData({
      ...filterData,
      country: values.country || '',
      state: values.state || '',
      city: values.city || '',
    })
  }

  const updateAddressList = () => {
    paginationTableRef.current?.refresh()
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
          const { addressConfig: newConfig }: CustomFieldItems =
            await getB2BAddressConfig()
          configList = newConfig

          dispatch({
            type: 'common',
            payload: {
              addressConfig: configList,
            },
          })
        }

        const key = role === 3 ? 'address_sales_rep' : 'address_admin'

        const editPermission =
          (configList || []).find(
            (config: AddressConfigItem) => config.key === 'address_book'
          )?.isEnabled === '1' &&
          (configList || []).find(
            (config: AddressConfigItem) => config.key === key
          )?.isEnabled === '1'

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
      snackbar.error(b3Lang('addresses.noPermissionToAdd'))
      return
    }
    addEditAddressRef.current?.handleOpenAddEditAddressClick('add')
  }

  const handleEdit = (row: AddressItemType) => {
    if (!editPermission) {
      snackbar.error(b3Lang('addresses.noPermissionToEdit'))
      return
    }
    addEditAddressRef.current?.handleOpenAddEditAddressClick('edit', row)
  }

  const handleDelete = (address: AddressItemType) => {
    if (!editPermission) {
      snackbar.error(b3Lang('addresses.noPermissionToEdit'))
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
    customLabel: b3Lang('addresses.addNewAddress'),
  }

  return (
    <B3Sping isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
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
        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={[]}
          rowsPerPageOptions={[12, 24, 36]}
          getRequestList={getAddressList}
          searchParams={filterData}
          isCustomRender
          itemXs={isExtraLarge ? 3 : 4}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          renderItem={(row: AddressItemType) => (
            <AddressItemCard
              key={row.id}
              item={row}
              onEdit={() => handleEdit(row)}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
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

        {editPermission && !isBCPermission && (
          <SetDefaultDialog
            isOpen={isOpenSetDefault}
            setIsOpen={setIsOpenSetDefault}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
            companyId={companyId}
          />
        )}
        {editPermission && (
          <DeleteAddressDialog
            isOpen={isOpenDelete}
            setIsOpen={setIsOpenDelete}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
            companyId={companyId}
            isBCPermission={isBCPermission}
          />
        )}
      </Box>
    </B3Sping>
  )
}

export default Address
