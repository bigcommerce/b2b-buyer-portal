import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import concat from 'lodash-es/concat';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { UserTypes } from '@/types';
import { snackbar } from '@/utils/b3Tip';
import { channelId } from '@/utils/basicConfig';
import { isKeyOf } from '@/utils/isKeyOf';

import { addUser } from './addUser';
import { checkUserEmail } from './checkUserEmail';
import {
  emailError,
  ExtraFieldsProps,
  FilterProps,
  getUsersFiles,
  UsersFilesProps,
} from './config';
import { getUser } from './getUser';
import getB2BUserExtraFields from './getUserExtraFields';
import { updateUser } from './updateUser';

export type HandleOpenAddEditUserClick = (
  options: { type: 'add' } | { type: 'edit'; userId: string },
) => Promise<void>;

interface AddEditUserProps {
  companyId: string;
  renderList: () => void;
}

interface SelectedDataProps {
  [key: string]: string | number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyRoleId: number;
  companyRoleName?: string;
  extraFields: { fieldName: string; fieldValue: string }[];
}

function AddEditUser({ companyId, renderList }: AddEditUserProps, ref: Ref<unknown> | undefined) {
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);

  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('');

  const [editData, setEditData] = useState<User>();

  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false);

  const [usersFiles, setUsersFiles] = useState<Array<UsersFilesProps>>([]);
  const [userExtrafields, setUserExtrafields] = useState<UsersFilesProps[] | []>([]);

  const b3Lang = useB3Lang();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    clearErrors,
    setValue,
    setError,
  } = useForm({
    mode: 'onSubmit',
  });

  const handleGetUsersFiles = async () => {
    const userExtrafields = await getB2BUserExtraFields();
    setUserExtrafields(userExtrafields);
  };

  useEffect(() => {
    if (userExtrafields.length === 0) {
      handleGetUsersFiles();
    }
  }, [userExtrafields.length]);

  const handleGetExtrafieldsInfo = (selectedData: SelectedDataProps) => {
    const keyValue = Object.keys(selectedData);

    const extrafields: ExtraFieldsProps[] = [];
    userExtrafields.forEach((item: UsersFilesProps) => {
      if (keyValue.includes(item.name)) {
        const extraField = {
          fieldName: item.name || '',
          fieldValue: selectedData[item.name] || '',
        };

        extrafields.push(extraField);
      }
    });

    return extrafields;
  };

  useEffect(() => {
    if (open) {
      const newUsersFiles = usersFiles.map((item: UsersFilesProps) => {
        const newItem = item;

        if (type === 'edit' && editData) {
          setValue(item.name, isKeyOf(editData, item.name) ? editData[item.name] : undefined);
        }

        return newItem;
      });

      setUsersFiles(newUsersFiles);
    }
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData, open, type]);

  const handleCancelClick = () => {
    usersFiles.forEach((item: UsersFilesProps) => {
      setValue(item.name, '');
      if (item.isExtraFields) {
        setValue(item.name, item.default || '');
      }
    });
    clearErrors();
    setOpen(false);
  };

  const validateEmailValue = async (emailValue: string) => {
    const {
      userType,
      userInfo: { companyName },
    } = await checkUserEmail({
      email: emailValue,
      companyId,
      channelId,
    });

    const isValid = [
      UserTypes.DOES_NOT_EXIST,
      UserTypes.B2C,
      UserTypes.CURRENT_B2B_COMPANY_DIFFERENT_CHANNEL,
    ].includes(userType);

    if (!isValid) {
      setError('email', {
        type: 'custom',
        message: b3Lang(emailError[userType], {
          companyName: companyName ? `(${companyName})` : '',
          email: emailValue,
        }),
      });
    }

    return {
      isValid,
      userType,
    };
  };

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true);
      const extraFieldsInfo = handleGetExtrafieldsInfo(data);
      let message = b3Lang('userManagement.addUserSuccessfully');

      try {
        const params: Partial<FilterProps> = {
          companyId,
          companyRoleId: Number(data.companyRoleId),
          ...data,
          extraFields: extraFieldsInfo,
        };

        if (type !== 'edit') {
          const { isValid, userType } = await validateEmailValue(data.email);

          if (!isValid) {
            setAddUpdateLoading(false);
            return;
          }

          if (userType === UserTypes.CURRENT_B2B_COMPANY_DIFFERENT_CHANNEL) {
            params.addChannel = true;
            message = b3Lang('userManagement.userDetected', {
              email: data.email,
            });
          }

          // @ts-expect-error params is currently too un-type-safe, needs fixing
          await addUser(params);
        }

        if (type === 'edit') {
          params.userId = editData?.id || '';
          message = b3Lang('userManagement.updateUserSuccessfully');
          delete params.email;

          // @ts-expect-error params is currently too un-type-safe, needs fixing
          await updateUser(params);
        }

        handleCancelClick();

        snackbar.success(message);

        renderList();
      } finally {
        setAddUpdateLoading(false);
      }
    })();
  };

  const handleOpenAddEditUserClick: HandleOpenAddEditUserClick = async (options) => {
    const { type } = options;
    const usersFiles = getUsersFiles(
      type,
      b3Lang,
      type === 'edit' ? b2bId === Number(options.userId) : false,
    );

    if (type === 'edit') {
      const { userId } = options;
      const data = await getUser({ userId, companyId });
      const extrafieldsInfo: ExtraFieldsProps[] = data.extraFields || [];
      let newData = data;
      if (extrafieldsInfo && extrafieldsInfo.length > 0) {
        const extrafieldsData: CustomFieldItems = {};

        extrafieldsInfo.forEach((item) => {
          extrafieldsData[item.fieldName] = item.fieldValue;
        });

        newData = {
          ...data,
          ...extrafieldsData,
        };
      }

      setEditData({ id: userId, ...newData });

      const companyRoleItem: UsersFilesProps | null =
        usersFiles.find((item) => item.name === 'companyRoleId') || null;
      if (companyRoleItem) {
        companyRoleItem.defaultName = data?.companyRoleName || '';
        companyRoleItem.default = data?.companyRoleId || '';
      }
    }
    const allUsersFiles = concat(usersFiles, userExtrafields);
    setUsersFiles(allUsersFiles);

    setType(type);
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    handleOpenAddEditUserClick,
  }));

  return (
    <B3Dialog
      isOpen={open}
      title={
        type === 'edit' ? b3Lang('userManagement.editUser') : b3Lang('userManagement.addNewUser')
      }
      leftSizeBtn={b3Lang('userManagement.cancel')}
      rightSizeBtn={b3Lang('userManagement.saveUser')}
      handleLeftClick={handleCancelClick}
      handRightClick={handleAddUserClick}
      loading={addUpdateLoading}
      isShowBordered
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

const B3AddEditUser = forwardRef(AddEditUser);

export default B3AddEditUser;
