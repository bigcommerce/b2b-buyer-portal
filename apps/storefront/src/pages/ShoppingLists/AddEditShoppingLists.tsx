import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { channelId, snackbar } from '@/utils';

import {
  getCreatedShoppingListFiles,
  GetFilterMoreListProps,
  ShoppingListsItemsProps,
} from './config';
import { createB2BShoppingList } from './createB2BShoppingList';
import { createBcShoppingList } from './createBcShoppingList';
import { duplicateB2BShoppingList } from './duplicateB2BShoppingList';
import { duplicateB2CShoppingList } from './duplicateB2CShoppingList';
import { updateB2BShoppingListDetails } from './updateB2BShoppingListDetails';
import { updateBcShoppingList } from './updateB2CShoppingListDetails';

interface AddEditUserProps {
  renderList: () => void;
  isB2BUser: boolean;
}

function AddEditShoppingLists(
  { renderList, isB2BUser }: AddEditUserProps,
  ref: Ref<unknown> | undefined,
) {
  const b2bPermissions = useAppSelector(rolePermissionSelector);
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('');

  const [editData, setEditData] = useState<ShoppingListsItemsProps | null>(null);

  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false);

  const [usersFiles, setUsersFiles] = useState<Array<GetFilterMoreListProps>>([]);
  const b3Lang = useB3Lang();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    clearErrors,
    setValue,
  } = useForm({
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open && type !== 'add' && editData) {
      usersFiles.forEach((item: GetFilterMoreListProps) => {
        setValue(item.name, (editData as CustomFieldItems)[item.name]);
      });
    }
  }, [editData, open, setValue, type, usersFiles]);

  const handleCancelClick = () => {
    usersFiles.forEach((item: GetFilterMoreListProps) => {
      setValue(item.name, '');
    });
    clearErrors();
    setOpen(false);
  };

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true);
      try {
        const params: Partial<ShoppingListsItemsProps> = {
          ...data,
        };

        // @ts-expect-error this all needs refactoring to give types a chance of matching
        let fn: (params: typeof params) => Promise<unknown> = isB2BUser
          ? createB2BShoppingList
          : createBcShoppingList;
        let successTip = b3Lang('shoppingLists.addSuccess');
        if (type === 'edit') {
          if (isB2BUser) {
            fn = updateB2BShoppingListDetails;
            params.status = editData?.status;
          } else {
            fn = updateBcShoppingList;
            params.channelId = channelId;
          }

          params.id = editData?.id || 0;
          successTip = b3Lang('shoppingLists.updateSuccess');
        } else if (type === 'dup') {
          fn = isB2BUser ? duplicateB2BShoppingList : duplicateB2CShoppingList;
          params.sampleShoppingListId = editData?.id || 0;
          successTip = b3Lang('shoppingLists.duplicateSuccess');
        } else if (type === 'add') {
          if (isB2BUser) {
            const { submitShoppingListPermission } = b2bPermissions;
            if (selectCompanyHierarchyId) {
              params.companyId = Number(selectCompanyHierarchyId);
            }
            params.status = submitShoppingListPermission
              ? ShoppingListStatus.Draft
              : ShoppingListStatus.Approved;
          } else {
            params.channelId = channelId;
          }
        }

        await fn(params);
        handleCancelClick();
        snackbar.success(successTip);
        renderList();
      } finally {
        setAddUpdateLoading(false);
      }
    })();
  };

  const handleOpenAddEditShoppingListsClick = (type: string, data: ShoppingListsItemsProps) => {
    const usersFiles = getCreatedShoppingListFiles(b3Lang);
    setUsersFiles(usersFiles);
    if (data) setEditData(data);
    setType(type);
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    handleOpenAddEditShoppingListsClick,
  }));

  const getTitle = () => {
    if (type === 'edit') {
      return b3Lang('shoppingLists.edit');
    }
    if (type === 'add') {
      return b3Lang('shoppingLists.createNewShoppingList');
    }
    return b3Lang('shoppingLists.duplicateShoppingList');
  };

  return (
    <B3Dialog
      isOpen={open}
      title={getTitle()}
      leftSizeBtn={b3Lang('shoppingLists.cancel')}
      rightSizeBtn={b3Lang('shoppingLists.save')}
      handleLeftClick={handleCancelClick}
      handRightClick={handleAddUserClick}
      loading={addUpdateLoading}
    >
      <B3CustomForm
        formFields={usersFiles}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />
    </B3Dialog>
  );
}

const B3AddEditShoppingLists = forwardRef(AddEditShoppingLists);

export default B3AddEditShoppingLists;
