import {
  useRef,
  useContext,
  useState,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'

import {
  B3CustomForm,
  B3Dialog,
} from '@/components'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  createB2BShoppingList,
} from '@/shared/service/b2b'

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
  open: boolean,
  onChange: ()=>void,
  onClose: ()=>void,
}

const CreateShoppingList = ({
  open,
  onChange,
  onClose,
}: CreateShoppingListProps) => {
  const container = useRef<HTMLInputElement | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  const {
    state: {
      role,
    },
  } = useContext(GlobaledContext)

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

  const handleClose = () => {
    onClose()
  }

  const handleConfirm = () => {
    handleSubmit(async (data) => {
      setLoading(true)
      const {
        description,
      } = data
      if (description.indexOf('\n') > -1) {
        data.description = description.split('\n').join('\\n')
      }
      const createShoppingData = {
        ...data,
        status: +role === 2 ? 30 : 0,
      }
      await createB2BShoppingList(createShoppingData)
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
      <Box
        ref={container}
      />

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
