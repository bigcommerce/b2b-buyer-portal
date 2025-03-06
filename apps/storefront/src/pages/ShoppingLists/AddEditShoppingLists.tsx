import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import {
  createB2BShoppingList,
  createBcShoppingList,
  duplicateB2BShoppingList,
  duplicateBcShoppingList,
  updateB2BShoppingList,
  updateBcShoppingList,
} from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { channelId, snackbar } from '@/utils';

import {
  getCreatedShoppingListFiles,
  GetFilterMoreListProps,
  ShoppingListsItemsProps,
} from './config';

interface AddEditUserProps {
  renderList: () => void;
  isB2BUser: boolean;
}

function AddEditShoppingLists(
  {
    renderList,
    // used to
    // - decide if submitShoppingListPermission should be used
    // - decide which method to use for creating/editing/duplicating a shopping list
    isB2BUser,
  }: AddEditUserProps,
  ref: Ref<unknown> | undefined,
) {
  // only uses submitShoppingListPermission if isB2BUser
  // used to decide if a new shopping list should be created in "draft" (30) or "approved" (0) status
  const b2bPermissions = useAppSelector(rolePermissionSelector);
  // used to set the company id when creating a new shopping list if isB2BUser
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  // modal visibility
  const [open, setOpen] = useState<boolean>(false);
  // type of modal: add, edit, duplicate
  // empty string is just a hack, it is never reset to empty string
  const [type, setType] = useState<string>('');

  // fields state, but not form state
  // used to populate the form with initial values for an edit or duplicate
  // setEditData is called by the parent component when opening the modal
  const [editData, setEditData] = useState<ShoppingListsItemsProps | null>(null);

  // loading state for the save button
  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false);

  // definitely not files, should be "fields"
  // no idea why this is stateful
  // the same hardcoded fields ("name", "description") are set on every modal open
  // this does not alter values, only aesthetics... but to the same things every time
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
      // "fields", not "files"
      // populates the initial form state when opening the modal for edit or duplicate
      usersFiles.forEach((item: GetFilterMoreListProps) => {
        setValue(item.name, (editData as CustomFieldItems)[item.name]);
      });
    }
  }, [editData, open, setValue, type, usersFiles]);

  const handleCancelClick = () => {
    // resets form state, probably could be done with a "reset" from useForm
    usersFiles.forEach((item: GetFilterMoreListProps) => {
      setValue(item.name, '');
    });
    clearErrors();
    setOpen(false);
  };

  // on save
  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true);
      try {
        const params: Partial<ShoppingListsItemsProps> = {
          ...data,
        };

        let fn = isB2BUser ? createB2BShoppingList : createBcShoppingList;
        let successTip = b3Lang('shoppingLists.addSuccess');
        if (type === 'edit') {
          if (isB2BUser) {
            fn = updateB2BShoppingList;
            // only set status if isB2BUser
            // the user cannot edit status in the UI
            // this will always be the original value, not sure why it's needed
            // b2c does not support statuses or works that out itself?
            params.status = editData?.status;
          } else {
            fn = updateBcShoppingList;
            // only b2c required the channelId
            params.channelId = channelId;
          }

          // 0 is never used, an edit will always have an id
          // this 'fallback' is just down to poor type definitions
          params.id = editData?.id || 0;
          successTip = b3Lang('shoppingLists.updateSuccess');
        } else if (type === 'dup') {
          fn = isB2BUser ? duplicateB2BShoppingList : duplicateBcShoppingList;
          // 0 is never used, a duplication will always have an id
          // this 'fallback' is just down to poor type definitions
          params.sampleShoppingListId = editData?.id || 0;
          successTip = b3Lang('shoppingLists.duplicateSuccess');
        } else if (type === 'add') {
          if (isB2BUser) {
            const { submitShoppingListPermission } = b2bPermissions;
            if (selectCompanyHierarchyId) {
              params.companyId = Number(selectCompanyHierarchyId);
            }
            // BUSINESS LOGIC:
            // submitShoppingListPermission === true "draft" (30) else "approved" (0) status
            params.status = submitShoppingListPermission ? 30 : 0;
          } else {
            // only b2c required the channelId
            // b2c does not support statuses or works that out itself?
            params.channelId = channelId;
          }
        }

        await fn(params);
        // not actually cancelling at all
        // this is just a hack to reset the form state
        // also how a subsequent "add" is given a fresh form state
        handleCancelClick();
        snackbar.success(successTip);
        // lots of indirection here
        // used to make the table component re-fetch data
        renderList();
      } finally {
        setAddUpdateLoading(false);
      }
    })();
  };

  // a remote control exposed to the parent component via useImperativeHandle and the ref
  // "type" is actually one of "add", "edit", "dup"
  // "data" will be used as the initial form state when opening the modal
  const handleOpenAddEditShoppingListsClick = (type: string, data: ShoppingListsItemsProps) => {
    // "fields", not "files"
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
