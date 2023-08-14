import { lazy, useContext, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Box } from '@mui/material'

import { GlobaledContext } from '@/shared/global'
import createShoppingList from '@/utils/b3ShoppingList'

const B3Dialog = lazy(() => import('../../../components/B3Dialog'))
const B3CustomForm = lazy(() => import('../../../components/B3CustomForm'))
const list = [
  {
    name: 'name',
    label: 'Name',
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    maxLength: 200,
  },
  {
    name: 'description',
    label: 'Description',
    required: false,
    default: '',
    fieldType: 'multiline',
    xs: 12,
    variant: 'filled',
    size: 'small',
    rows: 4,
    maxLength: 200,
  },
]

interface CreateShoppingListProps {
  open: boolean
  onChange: () => void
  onClose: () => void
}

function CreateShoppingList({
  open,
  onChange,
  onClose,
}: CreateShoppingListProps) {
  const container = useRef<HTMLInputElement | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  const {
    state: { role, isB2BUser, currentChannelId },
  } = useContext(GlobaledContext)

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const handleClose = () => {
    onClose()
  }

  const handleConfirm = () => {
    handleSubmit(async (data) => {
      const { name, description } = data

      setLoading(true)
      await createShoppingList({
        data: { name, description },
        isB2BUser,
        role: +role,
        currentChannelId,
      })
      setLoading(false)
      onChange()
    })()
  }

  return (
    <Box
      sx={{
        ml: 3,
        cursor: 'pointer',
        width: '50%',
      }}
    >
      <Box ref={container} />

      <B3Dialog
        isOpen={open}
        fullWidth
        title="Create new"
        loading={loading}
        handleLeftClick={handleClose}
        handRightClick={handleConfirm}
      >
        <Box
          sx={{
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <B3CustomForm
            formFields={list}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      </B3Dialog>
    </Box>
  )
}

export default CreateShoppingList
