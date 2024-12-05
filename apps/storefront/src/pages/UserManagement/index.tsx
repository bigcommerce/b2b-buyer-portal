import { useEffect, useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable } from '@/components/table/B3PaginationTable';
import { useCardListColumn, useMobile, useTableRef } from '@/hooks';
import { deleteUsers, getUsers } from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { snackbar } from '@/utils';

import B3AddEditUser from './AddEditUser';
import { FilterProps, getFilterMoreList, UsersList } from './config';
import { UserItemCard } from './UserItemCard';

interface RefCurrentProps extends HTMLInputElement {
  handleOpenAddEditUserClick: (type: string, data?: UsersList) => void;
}

interface RoleProps {
  role: string;
  companyRoleId: string | number;
}
function UserManagement() {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

  const [userItem, setUserItem] = useState<UsersList>({
    createdAt: 0,
    email: '',
    firstName: '',
    id: '',
    lastName: '',
    phone: '',
    role: 0,
    updatedAt: 0,
    extraFields: [],
    companyRoleName: '',
    companyRoleId: '',
  });
  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const isExtraLarge = useCardListColumn();

  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const role = useAppSelector(({ company }) => company.customer.role);
  const companyInfo = useAppSelector(({ company }) => company.companyInfo);

  const companyId = +role === CustomerRole.SUPER_ADMIN ? salesRepCompanyId : companyInfo?.id;

  const b2bPermissions = useAppSelector(rolePermissionSelector);

  const isEnableBtnPermissions = b2bPermissions.userActionsPermission;

  const addEditUserRef = useRef<RefCurrentProps | null>(null);
  const [paginationTableRef] = useTableRef();

  const customItem = {
    isEnabled: isEnableBtnPermissions,
    customLabel: b3Lang('userManagement.addUser'),
  };

  const initSearch = {
    search: '',
    companyRoleId: '',
    companyId,
  };
  const filterMoreInfo = getFilterMoreList(b3Lang);

  const [filterSearch, setFilterSearch] = useState<Partial<FilterProps>>(initSearch);

  const [translatedFilterInfo, setTranslatedFilterInfo] =
    useState<CustomFieldItems[]>(filterMoreInfo);
  const [valueName, setValueName] = useState<string>('');

  const fetchList = async (params: Partial<FilterProps>) => {
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
    addEditUserRef.current?.handleOpenAddEditUserClick('add');
  };

  const handleEdit = (userInfo: UsersList) => {
    addEditUserRef.current?.handleOpenAddEditUserClick('edit', userInfo);
  };

  const handleDelete = (row: UsersList) => {
    setUserItem(row);
    setDeleteOpen(true);
  };

  const handleCancelClick = () => {
    setDeleteOpen(false);
  };

  const handleDeleteUserClick = async (row: UsersList | undefined) => {
    if (!row) return;
    try {
      setIsRequestLoading(true);
      handleCancelClick();
      await deleteUsers({
        userId: row.id || '',
        companyId,
      });
      snackbar.success(b3Lang('userManagement.deleteUserSuccessfully'));
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
          columnItems={[]}
          rowsPerPageOptions={[12, 24, 36]}
          getRequestList={fetchList}
          searchParams={filterSearch || {}}
          isCustomRender
          itemXs={isExtraLarge ? 3 : 4}
          requestLoading={setIsRequestLoading}
          renderItem={(row: UsersList) => (
            <UserItemCard
              key={row.id || ''}
              item={row}
              isPermissions={isEnableBtnPermissions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        />
        <B3AddEditUser companyId={companyId} renderList={initSearchList} ref={addEditUserRef} />
        <B3Dialog
          isOpen={deleteOpen}
          title={b3Lang('userManagement.deleteUser')}
          leftSizeBtn={b3Lang('userManagement.cancel')}
          rightSizeBtn={b3Lang('userManagement.delete')}
          handleLeftClick={handleCancelClick}
          handRightClick={handleDeleteUserClick}
          row={userItem}
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
            {b3Lang('userManagement.confirmDelete')}
          </Box>
        </B3Dialog>
      </Box>
    </B3Spin>
  );
}

export default UserManagement;
