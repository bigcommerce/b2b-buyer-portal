import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { useCardListColumn } from '@/hooks/useCardListColumn';
import { useMobile } from '@/hooks/useMobile';
import { useTableRef } from '@/hooks/useTableRef';
import { useB3Lang } from '@/lib/lang';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { verifyCreatePermission } from '@/utils/b3CheckPermissions/check';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';
import { snackbar } from '@/utils/b3Tip';

import { B3PaginationTable, GetRequestList } from './table/B3PaginationTable';
import B3AddEditUser, { HandleOpenAddEditUserClick } from './AddEditUser';
import { getFilterMoreList } from './config';
import { deleteUser } from './deleteUser';
import { getUsers, GetUsersVariables } from './getUsers';
import { Delete, Edit, UserItemCard } from './UserItemCard';

interface RefCurrentProps extends HTMLInputElement {
  handleOpenAddEditUserClick: HandleOpenAddEditUserClick;
}

interface RoleProps {
  role: string;
  companyRoleId: string | number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyRoleName: string;
  companyInfo: { companyId: string };
}

function UserManagement() {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

  const [userId, setUserId] = useState<string>();
  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const isExtraLarge = useCardListColumn();

  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyInfo = useAppSelector(({ company }) => company.companyInfo);

  const companyId = Number(role) === CustomerRole.SUPER_ADMIN ? salesRepCompanyId : companyInfo?.id;

  const b2bPermissions = useAppSelector(rolePermissionSelector);
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const isEnableBtnPermissions = b2bPermissions.userCreateActionsPermission;

  const customItem = useMemo(() => {
    const { userCreateActionsPermission } = b2bPermissionsMap;

    const isCreatePermission = verifyCreatePermission(
      userCreateActionsPermission,
      Number(selectCompanyHierarchyId),
    );
    return {
      isEnabled: isEnableBtnPermissions && isCreatePermission,
      customLabel: b3Lang('userManagement.addUser'),
    };

    // ignore b3Lang due it's function that doesn't not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnableBtnPermissions, selectCompanyHierarchyId]);

  const addEditUserRef = useRef<RefCurrentProps | null>(null);
  const [paginationTableRef] = useTableRef();

  const initSearch = {
    first: 12,
    offset: 0,
    search: '',
    companyRoleId: '',
    companyId,
    q: '',
  };
  const filterMoreInfo = getFilterMoreList(b3Lang);

  const [filterSearch, setFilterSearch] = useState<GetUsersVariables>(initSearch);

  const [translatedFilterInfo, setTranslatedFilterInfo] =
    useState<CustomFieldItems[]>(filterMoreInfo);
  const [valueName, setValueName] = useState<string>('');

  const fetchList: GetRequestList<GetUsersVariables, User> = async (params) => {
    const data = await getUsers(params);

    const {
      users: { edges, totalCount },
    } = data;

    return {
      edges,
      totalCount,
    };
  };

  const initSearchList = () => {
    paginationTableRef.current?.refresh();
  };

  const handleGetTranslatedFilterInfo = () => {
    const translatedFilterInfo = filterMoreInfo.map((element: CustomFieldItems) => {
      const translatedItem = element;
      const translatedOptions = element.options?.map((option: CustomFieldItems) => {
        const elementOption = option;
        elementOption.label = b3Lang(option.idLang);
        return option;
      });

      translatedItem.options = translatedOptions;
      translatedItem.setValueName = setValueName;
      translatedItem.default = filterSearch.companyRoleId;
      translatedItem.defaultName = filterSearch.companyRoleId ? valueName : '';

      return element;
    });

    setTranslatedFilterInfo(translatedFilterInfo);

    return translatedFilterInfo;
  };

  const handleChange = (_: string, value: string) => {
    const search = {
      ...filterSearch,
      q: value,
    };
    setFilterSearch(search);
  };

  const handleFilterChange = (value: RoleProps) => {
    const search = {
      ...filterSearch,
      companyRoleId: value.companyRoleId,
      offset: 0,
    };
    setFilterSearch(search);
  };

  const handleAddUserClick = () => {
    addEditUserRef.current?.handleOpenAddEditUserClick({ type: 'add' });
  };

  const handleEdit: Edit = (userId) => {
    addEditUserRef.current?.handleOpenAddEditUserClick({ type: 'edit', userId });
  };

  const handleDelete: Delete = (id) => {
    setUserId(id);
    setDeleteOpen(true);
  };

  const handleCancelClick = () => {
    setDeleteOpen(false);
  };

  const handleDeleteUserClick = async (userId?: string) => {
    if (!userId) {
      return;
    }

    try {
      setIsRequestLoading(true);
      handleCancelClick();
      await deleteUser({
        userId,
        companyId: selectCompanyHierarchyId || companyId,
      });
      snackbar.success(b3Lang('userManagement.deleteUserSuccessfully'));
    } catch (err: unknown) {
      if (err instanceof Error) {
        const message =
          err.message === 'Company only have one user can not be deleted'
            ? b3Lang('userManagement.delete.error.atLeastOneUser')
            : b3Lang('userManagement.delete.error');
        snackbar.error(message);
      }
    } finally {
      setIsRequestLoading(false);
      initSearchList();
    }
  };

  useEffect(() => {
    handleGetTranslatedFilterInfo();

    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch, filterSearch.companyRoleId]);

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
          filterMoreInfo={translatedFilterInfo}
          handleChange={handleChange}
          handleFilterChange={handleFilterChange}
          customButtonConfig={customItem}
          handleFilterCustomButtonClick={handleAddUserClick}
        />
        <B3PaginationTable
          ref={paginationTableRef}
          getRequestList={fetchList}
          searchParams={filterSearch || {}}
          itemXs={isExtraLarge ? 3 : 4}
          requestLoading={setIsRequestLoading}
          renderItem={(row) => (
            <UserItemCard key={row.id} item={row} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        />
        <B3AddEditUser
          companyId={`${selectCompanyHierarchyId || companyId}`}
          renderList={initSearchList}
          ref={addEditUserRef}
        />
        <B3Dialog
          isOpen={deleteOpen}
          title={b3Lang('userManagement.deleteUser')}
          leftSizeBtn={b3Lang('userManagement.cancel')}
          rightSizeBtn={b3Lang('userManagement.delete')}
          handleLeftClick={handleCancelClick}
          handRightClick={handleDeleteUserClick}
          row={userId}
          rightStyleBtn={{
            color: '#D32F2F',
          }}
          isShowBordered={false}
        >
          <Box
            sx={{
              display: 'flex',
              width: isMobile ? '100%' : '450px',
              height: '100%',
            }}
          >
            {b3Lang('userManagement.confirmDelete')}
          </Box>
        </B3Dialog>
      </Box>
    </B3Spin>
  );
}

export default UserManagement;
