import {
  useRef,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Divider,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'
import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  useMobile,
} from '@/hooks'

import {
  B3CustomForm,
} from '@/components'

import {
  ThemeFrameContext,
} from '@/components/ThemeFrame'

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
  const [isMobile] = useMobile()
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

  const IframeDocument = useContext(ThemeFrameContext)
  useEffect(() => {
    if (IframeDocument) {
      IframeDocument.body.style.overflow = open ? 'hidden' : 'initial'
      IframeDocument.body.style.paddingRight = open ? '16px' : '0'
    }
  }, [open, IframeDocument])

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

      <Dialog
        open={open}
        fullWidth
        container={container.current}
        onClose={handleClose}
        fullScreen={isMobile}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle
          id="alert-dialog-title"
        >
          Create new
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{
            minHeight: '250px',
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: '20px',
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
        </DialogContent>

        <Divider />

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
          >
            <B3Sping
              isSpinning={loading}
              tip=""
              size={16}
            >
              save
            </B3Sping>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CreateShoppingList
