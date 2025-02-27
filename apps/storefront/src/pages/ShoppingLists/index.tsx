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
  // loading state for the Page's data
  // true when changing page/filtering/searching results or deleting a shopping list
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  // open state for the delete dialog
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  // which shopping list to delete after confirmation
  const [deleteItem, setDeleteItem] = useState<null | ShoppingListsItemsProps>(null);
  // state for an array of applicable filters for the current shopping list result set
  // stateful, as it relies on a list of all shopping list authors to be fetched to then become filters
  const [filterMoreInfo, setFilterMoreInfo] = useState<Array<any>>([]);
  // a function that builds the largely hard coded filter options, once the list of authors is fetched
  const getFilterMoreList = useGetFilterMoreList();

  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  // used to hoist a "refresh" (e.g. refetch) function back to this scope from the B3PaginationTable
  // used to refetch the shopping list data after one has been deleted
  const [paginationTableRef] = useTableRef();

  const {
    // used to
    // - decide if or not to use shoppingListCreateActionsPermission (ignored if !isB2BUser)
    // - decide which fetching function to use to get the shopping list results
    // - to enable filters (b2c API must not support filters)
    // - decide which mutating functions to use to create/edit/duplicate a shopping list
    isB2BUser,
    shoppingListCreateActionsPermission,
    // used to
    // - decide if or not show the "draft" or "rejected" status filters
    // - decide to set the initial filters to empty or to "approved" and "readyForApproval"
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
            // used on different page(s) (QuoteDraft, maybe more) to decide on a button's text content
            // and which url that button should navigate to
            quoteBtn: '',
            shoppingListBtn: '',
          },
        },
      });
    }
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // basically browser width >= 1536
  // used to decide how many columns the results should have, 3 or 4
  const isExtraLarge = useCardListColumn();

  const customItem = {
    // hides the button if the user is a B2B user without the shoppingListCreateActionsPermission
    isEnabled: isB2BUser ? shoppingListCreateActionsPermission : true,
    customLabel: b3Lang('shoppingLists.createNew'),
    customButtonStyle: {
      fontSize: '15px',
      fontWeight: '500',
      width: '140px',
      padding: '0',
    },
  };
  // decides to set the initial filters to empty or to "approved" and "readyForApproval"
  const statusPermissions = !submitShoppingListPermission ? [0, 40] : '';

  const initSearch = {
    search: '',
    createdBy: '',
    status: statusPermissions,
    isDefault: true,
  };

  // currently applied filters and search term
  const [filterSearch, setFilterSearch] = useState<ShoppingListSearch>(initSearch);

  // used to hoist a "handleOpenAddEditShoppingListsClick" function back to this scope from the AddEditShoppingLists
  // used configure the Add/Edit/Duplicate Shopping List dialog
  const addEditShoppingListsRef = useRef<RefCurrentProps | null>(null);

  const initSearchList = () => {
    paginationTableRef.current?.refresh();
  };

  // updates the filter state with an updated search term and reset other filters to their initial values
  // seems to ignore ignore updated sort orders (as this page doesn't have any, but the B3Filter tries to support them)
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

    // status 99 = all
    // attempts to restrict the status filter to only the statuses the user has permission to see
    // effectively overwriting all/no filter with statusPermissions
    // users without submitShoppingListPermission should only ever see "approved" and/or "readyForApproval" lists
    const getNewStatus = status === '' || status === 99 ? statusPermissions : status;
    const search = {
      ...initSearch,
      createdBy: data.createdBy,
      status: getNewStatus,
      // no idea what this is trying to achieve
      isDefault: status === '',
    };

    setFilterSearch(search);
  };

  // wrapper around b2b/bc API to fetch the shopping list results
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

  // opens the Add/Edit/Duplicate Shopping List dialog, configures it to be in "add" mode
  const handleAddShoppingListsClick = () => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('add');
  };

  // opens the Add/Edit/Duplicate Shopping List dialog, configures it to be in "edit" mode, passes the shopping list to edit
  const handleEdit = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('edit', shoppingList);
  };

  // opens the Add/Edit/Duplicate Shopping List dialog, configures it to be in "copy" mode, passes the shopping list to copy
  const handleCopy = (shoppingList: ShoppingListsItemsProps) => {
    addEditShoppingListsRef.current?.handleOpenAddEditShoppingListsClick('dup', shoppingList);
  };

  // opens the delete dialog, sets the shopping list to delete
  const handleDelete = (row: ShoppingListsItemsProps) => {
    setDeleteItem(row);
    setDeleteOpen(true);
  };

  const handleCancelClick = () => {
    setDeleteOpen(false);
  };

  const handleDeleteUserClick = async () => {
    // deleteOpen and deleteItem should be set atomically, but are not
    // this is a workaround/hack
    if (!deleteItem) return;
    try {
      setIsRequestLoading(true);
      handleCancelClick();
      // there should never be a case where deleteItem is null here
      // this is a workaround/hack
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
              justifyContent: `${isMobile ? 'center%' : 'start'}`,
              width: `${isMobile ? '100%' : '450px'}`,
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
