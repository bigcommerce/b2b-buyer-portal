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
  useCardListColumn,
} from '@/hooks'

import {
  getFilterMoreList,
  ShoppingListSearch,
  ShoppingListsItemsProps,
} from './config'

import AddEditShoppingLists from './AddEditShoppingLists'
import ShoppingListsCard from './ShoppingListsCard'
import B3Filter from '../../components/filter/B3Filter'

interface RefCurrntProps extends HTMLInputElement {
  handleOpenAddEditShoppingListsClick: (type: string, data?: ShoppingListsItemsProps) => void
}

const shoppingLists = () => {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)

  const [deleteItem, setDeleteItem] = useState<null | ShoppingListsItemsProps>(null)

  const [isMobile] = useMobile()

  const {
    state: {
      role,
    },
  } = useContext(GlobaledContext)

  const isExtraLarge = useCardListColumn()

  const isEnableBtnPermissions = true

  const customItem = {
    isEnabled: isEnableBtnPermissions,
    customLabel: 'Create new',
  }
  const statusPermissions = +role !== 2 ? [0, 40] : ''

  const initSearch = {
    search: '',
    createdBy: '',
    status: statusPermissions,
  }

  const [filterSearch, setFilterSearch] = useState<ShoppingListSearch>(initSearch)

  const addEditShoppingListsRef = useRef<RefCurrntProps | null>(null)

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

  const handleFirterChange = (data: ShoppingListSearch) => {
    const {
      status,
    } = data
    const getNewStatus = (status === '' || status === 99) ? statusPermissions : status
    const search = {
      ...initSearch,
      createdBy: data.createdBy,
      status: getNewStatus,
    }

    setFilterSearch(search)
  }

  const fetchList = async (params: ShoppingListSearch) => {
    const {
      shoppingLists: {
        edges, totalCount,
      },
    } = await getB2BShoppingList(params)
    return {
      edges,
      totalCount,
    }
  }

  const handleAddShoppingListsClick = () => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('add')
  }

  const handleEdit = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('edit', shoppingList)
  }

  const handleCopy = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('dup', shoppingList)
  }

  const handleDelete = (row: ShoppingListsItemsProps) => {
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
      snackbar.success('delete shoppingList successfully')
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
          handleFilterCustomButtomClick={handleAddShoppingListsClick}
        />
        <B3PaginationTable
          columnItems={[]}
          rowsPerPageOptions={[9, 18, 27]}
          getRequestList={fetchList}
          searchParams={filterSearch}
          isCustomRender
          itemXs={isExtraLarge ? 3 : 4}
          requestLoading={setIsRequestLoading}
          renderItem={(row: ShoppingListsItemsProps) => (
            <ShoppingListsCard
              key={row.id || ''}
              item={row}
              role={role}
              isPermissions={isEnableBtnPermissions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
            />
          )}
        />
        <AddEditShoppingLists
          role={role}
          renderList={initSearchList}
          ref={addEditShoppingListsRef}
        />
        <B3Dialog
          isOpen={deleteOpen}
          title="Delete shopping list"
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
            Are you sure you want to delete this shopping list?
          </Box>
        </B3Dialog>
      </Box>
    </B3Sping>
  )
}

export default shoppingLists
