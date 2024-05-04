import { useContext, useEffect, useRef, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import B3Dialog from '@/components/B3Dialog'
import B3Sping from '@/components/spin/B3Sping'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { useCardListColumn, useMobile, useTableRef } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  deleteB2BShoppingList,
  deleteBcShoppingList,
  getB2BShoppingList,
  getBcShoppingList,
  getShoppingListsCreatedByUser,
} from '@/shared/service/b2b'
import { isB2BUserSelector, useAppSelector } from '@/store'
import { snackbar } from '@/utils'

import B3Filter from '../../components/filter/B3Filter'

import AddEditShoppingLists from './AddEditShoppingLists'
import {
  getFilterMoreList,
  ShoppingListSearch,
  ShoppingListsItemsProps,
} from './config'
import ShoppingListsCard from './ShoppingListsCard'

interface RefCurrntProps extends HTMLInputElement {
  handleOpenAddEditShoppingListsClick: (
    type: string,
    data?: ShoppingListsItemsProps
  ) => void
}

function ShoppingLists() {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)

  const [deleteItem, setDeleteItem] = useState<null | ShoppingListsItemsProps>(
    null
  )

  const [fiterMoreInfo, setFiterMoreinfo] = useState<Array<any>>([])

  const [isMobile] = useMobile()

  const [paginationTableRef] = useTableRef()

  const b3Lang = useB3Lang()

  const salesRepCompanyId = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id
  )

  const {
    state: { currentChannelId, openAPPParams },
    dispatch,
  } = useContext(GlobaledContext)

  const isB2BUser = useAppSelector(isB2BUserSelector)
  const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id)
  const role = useAppSelector(({ company }) => company.customer.role)

  useEffect(() => {
    const initFilter = async () => {
      const companyId = companyB2BId || salesRepCompanyId
      let createdByUsers: CustomFieldItems = {}
      if (isB2BUser)
        createdByUsers = await getShoppingListsCreatedByUser(+companyId, 1)

      const filterInfo = getFilterMoreList(createdByUsers, role)

      const translatedFilterInfo = JSON.parse(JSON.stringify(filterInfo))

      translatedFilterInfo.forEach(
        (element: {
          label: string
          idLang: any
          name: string
          options: any[]
        }) => {
          const translatedInfo = element
          translatedInfo.label = b3Lang(element.idLang)
          if (element.name === 'status') {
            element.options?.map((option) => {
              const elementOption = option
              elementOption.label = b3Lang(option.idLang)
              return option
            })
          }

          return element
        }
      )

      setFiterMoreinfo(translatedFilterInfo)
    }

    initFilter()

    if (openAPPParams.shoppingListBtn) {
      dispatch({
        type: 'common',
        payload: {
          openAPPParams: {
            quoteBtn: '',
            shoppingListBtn: '',
          },
        },
      })
    }
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isExtraLarge = useCardListColumn()

  const isEnableBtnPermissions = true

  const customItem = {
    isEnabled: isEnableBtnPermissions,
    customLabel: b3Lang('shoppingLists.createNew'),
    customButtomStyle: {
      fontSize: '15px',
      fontWeight: '500',
      width: '140px',
      padding: '0',
    },
  }
  const statusPermissions = +role !== 2 ? [0, 40] : ''

  const initSearch = {
    search: '',
    createdBy: '',
    status: statusPermissions,
    isDefault: true,
  }

  const [filterSearch, setFilterSearch] =
    useState<ShoppingListSearch>(initSearch)

  const addEditShoppingListsRef = useRef<RefCurrntProps | null>(null)

  const initSearchList = () => {
    paginationTableRef.current?.refresh()
  }

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      const search = {
        ...initSearch,
        search: value,
      }

      setFilterSearch(search)
    }
  }

  const handleFirterChange = (data: ShoppingListSearch) => {
    const { status } = data

    const getNewStatus =
      status === '' || status === 99 ? statusPermissions : status
    const search = {
      ...initSearch,
      createdBy: data.createdBy,
      status: getNewStatus,
      isDefault: status === '',
    }

    setFilterSearch(search)
  }

  const fetchList = async (params: ShoppingListSearch) => {
    const newParams = isB2BUser
      ? params
      : {
          offset: params.offset,
          first: params.first,
          search: params.search,
          channelId: currentChannelId,
        }
    const getShoppingLists = isB2BUser ? getB2BShoppingList : getBcShoppingList
    const infoKey = isB2BUser ? 'shoppingLists' : 'customerShoppingLists'

    const {
      [infoKey]: { edges, totalCount },
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
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick(
      'edit',
      shoppingList
    )
  }

  const handleCopy = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick(
      'dup',
      shoppingList
    )
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

      const deleteShoppingList = isB2BUser
        ? deleteB2BShoppingList
        : deleteBcShoppingList
      await deleteShoppingList(id)
      snackbar.success(b3Lang('shoppingLists.deleteSuccess'))
    } finally {
      setIsRequestLoading(false)
      initSearchList()
    }
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
          showB3FilterMoreIcon={isB2BUser}
          fiterMoreInfo={fiterMoreInfo}
          handleChange={handleChange}
          handleFilterChange={handleFirterChange}
          customButtomConfig={customItem}
          handleFilterCustomButtomClick={handleAddShoppingListsClick}
        />
        <B3PaginationTable
          columnItems={[]}
          ref={paginationTableRef}
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
          title={b3Lang('shoppingLists.deleteShoppingList')}
          leftSizeBtn={b3Lang('shoppingLists.cancel')}
          rightSizeBtn={b3Lang('shoppingLists.delete')}
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
            {b3Lang('shoppingLists.confirmDelete')}
          </Box>
        </B3Dialog>
      </Box>
    </B3Sping>
  )
}

export default ShoppingLists
