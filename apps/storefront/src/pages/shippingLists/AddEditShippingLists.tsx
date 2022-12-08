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
  createB2BShoppingList,
  duplicateB2BShoppingList,
} from '@/shared/service/b2b'
import {
  B3CustomForm,
  B3Dialog,
} from '@/components'

import {
  snackbar,
} from '@/utils'

import {
  getCreatedShippingListFiles,
  ShippingListsItemsProps,
  GetFilterMoreListProps,
} from './config'

interface AddEditUserProps {
  renderList: () => void
  role: number | string
}

const AddEditShippingLists = ({
  renderList,
  role,
}: AddEditUserProps, ref: Ref<unknown> | undefined) => {
  const [open, setOpen] = useState<boolean>(false)
  const [type, setType] = useState<string>('')

  const [editData, setEditData] = useState<ShippingListsItemsProps | null>(null)

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
        const params: Partial<ShippingListsItemsProps> = {
          ...data,
        }

        let fn = createB2BShoppingList
        let successTip = 'add shippingLists successfully'

        if (type === 'edit') {
          fn = updateB2BShoppingList
          params.id = editData?.id || 0
          params.status = editData?.status
          successTip = 'update shippingLists successfully'
        } else if (type === 'dup') {
          fn = duplicateB2BShoppingList
          params.sampleShoppingListId = editData?.id || 0
          successTip = 'duplicate shippingLists successfully'

          // params.status = +role === 2 ? 30 : editData?.status
        } else if (type === 'add') {
          params.status = +role === 2 ? 30 : 0
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

  const handleOpenAddEditShippingListsClick = (type: string, data: ShippingListsItemsProps) => {
    const usersFiles = getCreatedShippingListFiles()
    setUsersFiles(usersFiles)
    if (data) setEditData(data)
    setType(type)
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    handleOpenAddEditShippingListsClick,
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

const B3AddEditShippingLists = forwardRef(AddEditShippingLists)

export default B3AddEditShippingLists
