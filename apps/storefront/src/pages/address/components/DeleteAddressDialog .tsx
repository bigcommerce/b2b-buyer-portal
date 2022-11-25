import {
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

import {
  Box,
  Typography,
} from '@mui/material'

import {
  B3ConfirmDialog,
} from '@/components/B3ConfirmDialog'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  AddressItemType,
} from '../../../types/address'

import {
  deleteB2BAddress,
} from '@/shared/service/b2b'

interface DeleteAddressDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  addressData?: AddressItemType
  updateAddressList: (isFirst?: boolean) => void
}

export const DeleteAddressDialog = (props: DeleteAddressDialogProps) => {
  const {
    isOpen,
    setIsOpen,
    addressData,
    updateAddressList,
  } = props

  const {
    state: {
      isB2BUser,
      companyInfo: {
        id: companyId,
      },
    },
  } = useContext(GlobaledContext)

  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!addressData) {
      return
    }

    try {
      setIsLoading(true)

      const {
        id = '',
      } = addressData

      if (isB2BUser) {
        await deleteB2BAddress({
          addressId: id,
          companyId,
        })
      } else {
        // TODO BC接口
      }

      updateAddressList()

      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <B3ConfirmDialog
      title="Set as default address"
      isHiddenDivider
      confirmText="Delete"
      confirmColor="error"
      isShowCloseIcon={false}
      isConfirmDisabled={isLoading}
      isOpen={isOpen}
      fullWidth={false}
      onClose={() => { setIsOpen(false) }}
      onConfirm={handleDelete}
      isSpinning={isLoading}
    >
      <Box
        sx={{
          padding: '10px 24px',
          minWidth: '420px',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            marginTop: '1em',
            marginBottom: '1em',
          }}
        >
          Are you sure you want to delete this address?
        </Typography>
      </Box>
    </B3ConfirmDialog>
  )
}
