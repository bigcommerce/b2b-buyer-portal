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
  updateB2BShoppingList,
  updateBcShoppingList,
  createB2BShoppingList,
  createBcShoppingList,
  duplicateB2BShoppingList,
  duplicateBcShoppingList,
} from '@/shared/service/b2b'
import {
  B3CustomForm,
  B3Dialog,
} from '@/components'

import {
  snackbar,
} from '@/utils'

import {
  getCreatedShoppingListFiles,
  ShoppingListsItemsProps,
  GetFilterMoreListProps,
} from './config'

interface AddEditUserProps {
  renderList: () => void
  role: number | string
  isB2BUser: boolean
  channelId: number
}

const AddEditShoppingLists = ({
  renderList,
  role,
  isB2BUser,
  channelId,
}: AddEditUserProps, ref: Ref<unknown> | undefined) => {
  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')

  const [editData, setEditData] = useState<ShoppingListsItemsProps | null>(null)

  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false)

  const [usersFiles, setUsersFiles] = useState<Array<GetFilterMoreListProps>>([])

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    clearErrors,
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (open && type !== 'add' && editData) {
      usersFiles.forEach((item: GetFilterMoreListProps) => {
        setValue(item.name, (editData as CustomFieldItems)[item.name])
      })
    }
  }, [open, type])

  const handleCancelClick = () => {
    usersFiles.forEach((item: GetFilterMoreListProps) => {
      setValue(item.name, '')
    })
    clearErrors()
    setOpen(false)
  }

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true)
      try {
        const {
          description,
        } = data
        if (description.indexOf('\n') > -1) {
          data.description = description.split('\n').join('\\n')
        }
        const params: Partial<ShoppingListsItemsProps> = {
          ...data,
        }

        let fn = isB2BUser ? createB2BShoppingList : createBcShoppingList
        let successTip = 'add shoppingLists successfully'

        if (type === 'edit') {
          if (isB2BUser) {
            fn = updateB2BShoppingList
            params.status = editData?.status
          } else {
            fn = updateBcShoppingList
            params.channelId = channelId
          }

          params.id = editData?.id || 0
          successTip = 'update shoppingLists successfully'
        } else if (type === 'dup') {
          fn = isB2BUser ? duplicateB2BShoppingList : duplicateBcShoppingList
          params.sampleShoppingListId = editData?.id || 0
          successTip = 'duplicate shoppingLists successfully'

          // params.status = +role === 2 ? 30 : editData?.status
        } else if (type === 'add') {
          if (isB2BUser) {
            params.status = +role === 2 ? 30 : 0
          } else {
            params.channelId = channelId
          }
        }

        await fn(params)
        handleCancelClick()
        snackbar.success(successTip)
        renderList()
      } finally {
        setAddUpdateLoading(false)
      }
    })()
  }

  const handleOpenAddEditShoppingListsClick = (type: string, data: ShoppingListsItemsProps) => {
    const usersFiles = getCreatedShoppingListFiles()
    setUsersFiles(usersFiles)
    if (data) setEditData(data)
    setType(type)
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    handleOpenAddEditShoppingListsClick,
  }))

  const getTitle = () => {
    if (type === 'edit') {
      return 'Edit shopping list'
    } if (type === 'add') {
      return 'Create new shopping list'
    }
    return 'Duplicate shopping list'
  }

  return (
    <B3Dialog
      isOpen={open}
      title={getTitle()}
      leftSizeBtn="cancel"
      rightSizeBtn="Save"
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
  )
}

const B3AddEditShoppingLists = forwardRef(AddEditShoppingLists)

export default B3AddEditShoppingLists
