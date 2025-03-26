import { useContext, useEffect, useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { useCardListColumn, useMobile, useTableRef } from '@/hooks';
import { GlobalContext } from '@/shared/global';
import {
  deleteB2BShoppingList,
  deleteBcShoppingList,
  getB2BShoppingList,
  getBcShoppingList,
  getShoppingListsCreatedByUser,
} from '@/shared/service/b2b';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { channelId, snackbar } from '@/utils';

import AddEditShoppingLists from './AddEditShoppingLists';
import { ShoppingListSearch, ShoppingListsItemsProps, useGetFilterMoreList } from './config';
import ShoppingListsCard from './ShoppingListsCard';

interface RefCurrentProps extends HTMLInputElement {
  handleOpenAddEditShoppingListsClick: (type: string, data?: ShoppingListsItemsProps) => void;
}

function useData() {
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id);
  const { shoppingListCreateActionsPermission, submitShoppingListPermission } =
    useAppSelector(rolePermissionSelector);
  const companyId = companyB2BId || salesRepCompanyId;

  const deleteShoppingList = isB2BUser ? deleteB2BShoppingList : deleteBcShoppingList;

  const getUserShoppingLists = isB2BUser
    ? () => getShoppingListsCreatedByUser(Number(companyId), 1)
    : () => Promise.resolve({});

  return {
    isB2BUser,
    shoppingListCreateActionsPermission,
    submitShoppingListPermission,
    deleteShoppingList,
    getUserShoppingLists,
  };
}

function ShoppingLists() {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<null | ShoppingListsItemsProps>(null);
  const [filterMoreInfo, setFilterMoreInfo] = useState<Array<any>>([]);
  const getFilterMoreList = useGetFilterMoreList();

  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const [paginationTableRef] = useTableRef();

  const {
    isB2BUser,
    shoppingListCreateActionsPermission,
    submitShoppingListPermission,
    deleteShoppingList,
    getUserShoppingLists,
  } = useData();

  const {
    state: { openAPPParams },
    dispatch,
  } = useContext(GlobalContext);

  useEffect(() => {
    const initFilter = async () => {
      setFilterMoreInfo(
        getFilterMoreList(submitShoppingListPermission, await getUserShoppingLists()),
      );
    };

    initFilter();

    if (openAPPParams.shoppingListBtn) {
      dispatch({
        type: 'common',
        payload: {
          openAPPParams: {
            quoteBtn: '',
            shoppingListBtn: '',
          },
        },
      });
    }
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isExtraLarge = useCardListColumn();

  const customItem = {
    isEnabled: isB2BUser ? shoppingListCreateActionsPermission : true,
    customLabel: b3Lang('shoppingLists.createNew'),
    customButtonStyle: {
      fontSize: '15px',
      fontWeight: '500',
      width: '140px',
      padding: '0',
    },
  };
  const statusPermissions = !submitShoppingListPermission ? [0, 40] : '';

  const initSearch = {
    search: '',
    createdBy: '',
    status: statusPermissions,
    isDefault: true,
  };

  const [filterSearch, setFilterSearch] = useState<ShoppingListSearch>(initSearch);

  const addEditShoppingListsRef = useRef<RefCurrentProps | null>(null);

  const initSearchList = () => {
    paginationTableRef.current?.refresh();
  };

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      const search = {
        ...initSearch,
        search: value,
      };

      setFilterSearch(search);
    }
  };

  const handleFilterChange = (data: ShoppingListSearch) => {
    const { status } = data;

    const getNewStatus = status === '' || status === 99 ? statusPermissions : status;
    const search = {
      ...initSearch,
      createdBy: data.createdBy,
      status: getNewStatus,
      isDefault: status === '',
    };

    setFilterSearch(search);
  };

  const fetchList: GetRequestList<ShoppingListSearch, ShoppingListsItemsProps> = async (params) => {
    const { edges, totalCount } = isB2BUser
      ? await getB2BShoppingList(params)
      : await getBcShoppingList({
          offset: params.offset,
          first: params.first,
          search: params.search,
          channelId,
        });

    return {
      edges,
      totalCount,
    };
  };

  const handleAddShoppingListsClick = () => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('add');
  };

  const handleEdit = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('edit', shoppingList);
  };

  const handleCopy = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('dup', shoppingList);
  };

  const handleDelete = (row: ShoppingListsItemsProps) => {
    setDeleteItem(row);
    setDeleteOpen(true);
  };

  const handleCancelClick = () => {
    setDeleteOpen(false);
  };

  const handleDeleteUserClick = async () => {
    if (!deleteItem) return;
    try {
      setIsRequestLoading(true);
      handleCancelClick();

      await deleteShoppingList(deleteItem?.id || 0);

      snackbar.success(b3Lang('shoppingLists.deleteSuccess'));
    } finally {
      setIsRequestLoading(false);
      initSearchList();
    }
  };

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <B3Filter
          showB3FilterMoreIcon={isB2BUser}
          filterMoreInfo={filterMoreInfo}
          handleChange={handleChange}
          handleFilterChange={handleFilterChange}
          customButtonConfig={customItem}
          handleFilterCustomButtonClick={handleAddShoppingListsClick}
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
          renderItem={(row) => (
            <ShoppingListsCard
              key={row.id || ''}
              item={row}
              isPermissions={isB2BUser ? shoppingListCreateActionsPermission : true}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
              isB2BUser={isB2BUser}
            />
          )}
        />
        <AddEditShoppingLists
          renderList={initSearchList}
          ref={addEditShoppingListsRef}
          isB2BUser={isB2BUser}
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
              justifyContent: isMobile ? 'center%' : 'start',
              width: isMobile ? '100%' : '450px',
              height: '100%',
            }}
          >
            {b3Lang('shoppingLists.confirmDelete')}
          </Box>
        </B3Dialog>
      </Box>
    </B3Spin>
  );
}

export default ShoppingLists;
