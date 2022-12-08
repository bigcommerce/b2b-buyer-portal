import {
  useState,
  useContext,
  useRef,
} from 'react'

import {
  Box,
} from '@mui/material'
import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  getB2BShoppingList,
  deleteB2BShoppingList,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import {
  B3Dialog,
} from '@/components'

import {
  snackbar,
} from '@/utils'

import {
  useMobile,
} from '@/hooks'

import {
  getFilterMoreList,
  ShippingListSearch,
  ShippingListsItemsProps,
} from './config'

import AddEditShippingLists from './AddEditShippingLists'
import ShippingListsCard from './ShippingListsCard'
import B3Filter from '../../components/filter/B3Filter'

interface RefCurrntProps extends HTMLInputElement {
  handleOpenAddEditShippingListsClick: (type: string, data?: ShippingListsItemsProps) => void
}

const shippingLists = () => {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)

  const [deleteItem, setDeleteItem] = useState<null | ShippingListsItemsProps>(null)

  const [isMobile] = useMobile()

  const {
    state: {
      role,
    },
  } = useContext(GlobaledContext)

  const isEnableBtnPermissions = true

  const customItem = {
    isEnabled: isEnableBtnPermissions,
    customLabel: 'Create new',
  }

  const initSearch = {
    search: '',
    createdBy: '',
    Status: '',
  }

  const [filterSearch, setFilterSearch] = useState<ShippingListSearch>(initSearch)

  const addEditShippingListsRef = useRef<RefCurrntProps | null>(null)

  const initSearchList = () => {
    setFilterSearch({
      ...initSearch,
    })
  }

  const fiterMoreInfo = getFilterMoreList(role)

  const handleChange = (key:string, value: string) => {
    if (key === 'search') {
      const search = {
        ...initSearch,
        search: value,
      }
      setFilterSearch(search)
    }
  }

  const handleFirterChange = (data: ShippingListSearch) => {
    const search = {
      ...initSearch,
      createdBy: data.createdBy,
      status: data.status,
    }

    setFilterSearch(search)
  }

  const handleAddShippingListsClick = () => {
    addEditShippingListsRef.current?.handleOpenAddEditShippingListsClick('add')
  }

  const handleEdit = (shippingList: ShippingListsItemsProps) => {
    addEditShippingListsRef.current?.handleOpenAddEditShippingListsClick('edit', shippingList)
  }

  const handleCopy = (shippingList: ShippingListsItemsProps) => {
    addEditShippingListsRef.current?.handleOpenAddEditShippingListsClick('dup', shippingList)
  }

  const handleDelete = (row: ShippingListsItemsProps) => {
    setDeleteItem(row)
    setDeleteOpen(true)
  }

  const handleCancelClick = () => {
    setDeleteOpen(false)
  }

  const handleDeleteUserClick = async () => {
    if (!deleteItem) return
    try {
      setIsRequestLoading(true)
      handleCancelClick()
      const id: number = deleteItem?.id || 0
      await deleteB2BShoppingList(id)
      snackbar.success('delete shippingList successfully')
      initSearchList()
    } finally {
      setIsRequestLoading(false)
    }
  }

  return (
    <B3Sping
      isSpinning={isRequestLoading}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <B3Filter
          fiterMoreInfo={fiterMoreInfo}
          handleChange={handleChange}
          handleFilterChange={handleFirterChange}
          customButtomConfig={customItem}
          handleFilterCustomButtomClick={handleAddShippingListsClick}
        />
        <B3PaginationTable
          columnItems={[]}
          rowsPerPageOptions={[9, 18, 27]}
          getRequestList={getB2BShoppingList}
          requestKey="shoppingLists"
          searchParams={filterSearch}
          isCustomRender
          requestLoading={setIsRequestLoading}
          renderItem={(row: any) => (
            <ShippingListsCard
              key={row.id || ''}
              item={row}
              isPermissions={isEnableBtnPermissions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
            />
          )}
        />
        <AddEditShippingLists
          role={role}
          renderList={initSearchList}
          ref={addEditShippingListsRef}
        />
        <B3Dialog
          isOpen={deleteOpen}
          title="Delete user"
          leftSizeBtn="cancel"
          rightSizeBtn="delete"
          handleLeftClick={handleCancelClick}
          handRightClick={handleDeleteUserClick}
          row={deleteItem}
          rightStyleBtn={{
            color: '#D32F2F',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: `${isMobile ? 'center%' : 'start'}`,
              width: `${isMobile ? '100%' : '450px'}`,
              height: '100%',
            }}
          >
            Are you sure you want to delete this user?
          </Box>
        </B3Dialog>
      </Box>
    </B3Sping>
  )
}

export default shippingLists
