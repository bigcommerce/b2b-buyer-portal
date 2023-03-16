import {
  useState,
  useContext,
  useRef,
  useEffect,
} from 'react'

import {
  Box,
} from '@mui/material'
import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  getB2BShoppingList,
  getBcShoppingList,
  deleteB2BShoppingList,
  deleteBcShoppingList,
  getShoppingListsCreatedByUser,
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

  const [fiterMoreInfo, setFiterMoreinfo] = useState<Array<any>>([])

  const [isMobile] = useMobile()

  const {
    state: {
      role,
      isB2BUser,
      currentChannelId,
      companyInfo: {
        id: companyB2BId,
      },
      salesRepCompanyId,
    },
  } = useContext(GlobaledContext)

  useEffect(() => {
    const initFilter = async () => {
      const companyId = companyB2BId || salesRepCompanyId
      let createdByUsers: CustomFieldItems = {}
      if (isB2BUser) createdByUsers = await getShoppingListsCreatedByUser(+companyId, 1)

      const filterInfo = getFilterMoreList(createdByUsers, role)
      setFiterMoreinfo(filterInfo)
    }

    initFilter()
  }, [])

  const isExtraLarge = useCardListColumn()

  const isEnableBtnPermissions = true

  const customItem = {
    isEnabled: isEnableBtnPermissions,
    customLabel: 'Create new',
    customButtomStyle: {
      fontSize: '15px',
      fontWeight: '500',
      color: '#FFFFFF',
    },
  }
  const statusPermissions = +role !== 2 ? [0, 40] : ''

  const initSearch = {
    search: '',
    createdBy: '',
    status: statusPermissions,
    isDefault: true,
  }

  const [filterSearch, setFilterSearch] = useState<ShoppingListSearch>(initSearch)

  const addEditShoppingListsRef = useRef<RefCurrntProps | null>(null)

  const initSearchList = () => {
    setFilterSearch({
      ...initSearch,
    })
  }

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
      isDefault: status === '',
    }

    setFilterSearch(search)
  }

  const fetchList = async (params: ShoppingListSearch) => {
    const newParams = isB2BUser ? params : {
      offset: params.offset,
      first: params.first,
      search: params.search,
      channelId: currentChannelId,
    }
    const getShoppingLists = isB2BUser ? getB2BShoppingList : getBcShoppingList
    const infoKey = isB2BUser ? 'shoppingLists' : 'customerShoppingLists'

    const {
      [infoKey]: {
        edges, totalCount,
      },
    } = await getShoppingLists(newParams)
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

      const deleteShoppingList = isB2BUser ? deleteB2BShoppingList : deleteBcShoppingList
      await deleteShoppingList(id)
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
          showB3FilterMoreIcon={isB2BUser}
          fiterMoreInfo={fiterMoreInfo}
          handleChange={handleChange}
          handleFilterChange={handleFirterChange}
          customButtomConfig={customItem}
          handleFilterCustomButtomClick={handleAddShoppingListsClick}
        />
        <B3PaginationTable
          columnItems={[]}
          rowsPerPageOptions={[12, 24, 36]}
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
              isB2BUser={isB2BUser}
            />
          )}
        />
        <AddEditShoppingLists
          role={role}
          renderList={initSearchList}
          ref={addEditShoppingListsRef}
          isB2BUser={isB2BUser}
          channelId={currentChannelId}
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
          isShowBordered={false}
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
