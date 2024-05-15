import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import concat from 'lodash-es/concat'

import { B3CustomForm } from '@/components'
import B3Dialog from '@/components/B3Dialog'
import { addOrUpdateUsers, checkUserEmail } from '@/shared/service/b2b'
import { useAppSelector } from '@/store'
import { UserTypes } from '@/types'
import { channelId, snackbar } from '@/utils'

import {
  emailError,
  ExtraFieldsProps,
  FilterProps,
  getUsersFiles,
  UsersFilesProps,
  UsersList,
} from './config'
import getB2BUserExtraFields from './getUserExtraFields'

interface AddEditUserProps {
  companyId: string | number
  renderList: () => void
}

interface SelectedDataProps {
  [key: string]: string | number
}

function AddEditUser(
  { companyId, renderList }: AddEditUserProps,
  ref: Ref<unknown> | undefined
) {
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId)

  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')

  const [editData, setEditData] = useState<UsersList | null>(null)

  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false)

  const [usersFiles, setUsersFiles] = useState<Array<UsersFilesProps>>([])
  const [userExtrafields, setUserExtrafields] = useState<
    UsersFilesProps[] | []
  >([])

  const b3Lang = useB3Lang()

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
  })

  const handleGetUsersFiles = async () => {
    const userExtrafields = await getB2BUserExtraFields()
    setUserExtrafields(userExtrafields)
  }

  useEffect(() => {
    if (userExtrafields.length === 0) {
      handleGetUsersFiles()
    }
  }, [userExtrafields.length])

  const handleGetExtrafieldsInfo = (selectedData: SelectedDataProps) => {
    const keyValue = Object.keys(selectedData)

    const extrafields: ExtraFieldsProps[] = []
    userExtrafields.forEach((item: UsersFilesProps) => {
      if (keyValue.includes(item.name)) {
        const extraField = {
          fieldName: item.name || '',
          fieldValue: selectedData[item.name] || '',
        }

        extrafields.push(extraField)
      }
    })

    return extrafields
  }

  useEffect(() => {
    if (open && type === 'edit' && editData) {
      usersFiles.forEach((item: UsersFilesProps) => {
        setValue(item.name, editData[item.name])
      })
    }
  }, [editData, open, setValue, type, usersFiles])

  const handleCancelClick = () => {
    usersFiles.forEach((item: UsersFilesProps) => {
      setValue(item.name, '')
      if (item.isExtraFields) {
        setValue(item.name, item.default || '')
      }
    })
    clearErrors()
    setOpen(false)
  }

  const validateEmailValue = async (emailValue: string) => {
    const {
      userEmailCheck: {
        userType,
        userInfo: { companyName },
      },
    }: CustomFieldItems = await checkUserEmail({
      email: emailValue,
      companyId,
      channelId,
    })

    const isValid = [
      UserTypes.DOESNT_EXIST,
      UserTypes.B2C,
      UserTypes.CURRENT_B2B_COMPANY_DIFFERENT_CHANNEL,
    ].includes(userType)

    if (!isValid) {
      setError('email', {
        type: 'custom',
        message: b3Lang(emailError[userType], {
          companyName: companyName ? `(${companyName})` : '',
          email: emailValue,
        }),
      })
    }

    return {
      isValid,
      userType,
    }
  }

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true)
      const extraFieldsInfo = handleGetExtrafieldsInfo(data)
      let message = b3Lang('userManagement.addUserSuccessfully')

      try {
        const params: Partial<FilterProps> = {
          companyId,
          ...data,
          extraFields: extraFieldsInfo,
        }

        if (type !== 'edit') {
          const { isValid, userType } = await validateEmailValue(data.email)

          if (!isValid) {
            setAddUpdateLoading(false)
            return
          }

          if (userType === UserTypes.CURRENT_B2B_COMPANY_DIFFERENT_CHANNEL) {
            params.addChannel = true
            message = b3Lang('userManagement.userDetected', {
              email: data.email,
            })
          }
        }

        if (type === 'edit') {
          params.userId = editData?.id || ''
          message = b3Lang('userManagement.updateUserSuccessfully')
          delete params.email
        }
        await addOrUpdateUsers(params)
        handleCancelClick()

        snackbar.success(message)

        renderList()
      } finally {
        setAddUpdateLoading(false)
      }
    })()
  }

  const handleOpenAddEditUserClick = (type: string, data: UsersList) => {
    if (type === 'edit') {
      const extrafieldsInfo: ExtraFieldsProps[] = data.extraFields || []
      let newData = data
      if (extrafieldsInfo && extrafieldsInfo.length > 0) {
        const extrafieldsData: CustomFieldItems = {}

        extrafieldsInfo.forEach((item) => {
          extrafieldsData[item.fieldName] = item.fieldValue
        })

        newData = {
          ...data,
          ...extrafieldsData,
        }
      }

      setEditData(newData)
    }
    const usersFiles = getUsersFiles(
      type,
      b3Lang,
      type === 'edit' ? b2bId === +data.id : false
    )

    const allUsersFiles = concat(usersFiles, userExtrafields)
    setUsersFiles(allUsersFiles)
    setType(type)
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    handleOpenAddEditUserClick,
  }))

  return (
    <B3Dialog
      isOpen={open}
      title={`${
        type === 'edit'
          ? b3Lang('userManagement.editUser')
          : b3Lang('userManagement.addNewUser')
      }`}
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
  )
}

const B3AddEditUser = forwardRef(AddEditUser)

export default B3AddEditUser
