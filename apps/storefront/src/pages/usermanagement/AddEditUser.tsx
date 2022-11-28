import {
  useState,
  forwardRef,
  useImperativeHandle,
  Ref,
  useEffect,
} from 'react'

import {
  useForm,
} from 'react-hook-form'

import {
  addOrUpdateUsers,
} from '@/shared/service/b2b'
import {
  B3CustomForm,
  B3Dialog,
} from '@/components'

import {
  snackbar,
} from '@/utils'

import {
  getUsersFiles,
  UsersList,
  UsersFilesProps,
  filterProps,
} from './config'

interface AddEditUserProps {
  companyId: string | number
  renderList: () => void
}

const AddEditUser = ({
  companyId,
  renderList,
}: AddEditUserProps, ref: Ref<unknown> | undefined) => {
  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')

  const [editData, setEditData] = useState<UsersList | null>(null)

  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false)

  const [usersFiles, setUsersFiles] = useState<Array<UsersFilesProps>>([])

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (open && type === 'edit' && editData) {
      usersFiles.forEach((item: UsersFilesProps) => {
        setValue(item.name, editData[item.name])
      })
    }
  }, [open, type])

  const handleCancelClick = () => {
    usersFiles.forEach((item: UsersFilesProps) => {
      setValue(item.name, '')
    })
    setOpen(false)
  }

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true)
      try {
        const params: Partial<filterProps> = {
          companyId,
          ...data,
        }
        if (type === 'edit') {
          params.userId = editData?.id || ''
          delete params.email
        }
        await addOrUpdateUsers(params)
        handleCancelClick()
        snackbar.success('add user successfully')
        renderList()
      } finally {
        setAddUpdateLoading(false)
      }
    })()
  }

  const handleOpenAddEditUserClick = (type: string, data: UsersList) => {
    const usersFiles = getUsersFiles(type)
    setUsersFiles(usersFiles)
    setEditData(data)
    setType(type)
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    handleOpenAddEditUserClick,
  }))

  return (
    <B3Dialog
      isOpen={open}
      title="Add new user"
      leftSizeBtn="cancel"
      rightSizeBtn="Save user"
      handleLeftClick={handleCancelClick}
      handRightClick={handleAddUserClick}
      loading={addUpdateLoading}
      rightStyleBtn={{
        color: 'red',
      }}
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
