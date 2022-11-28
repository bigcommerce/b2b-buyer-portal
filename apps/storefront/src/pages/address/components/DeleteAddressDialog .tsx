import {
  Dispatch,
  SetStateAction,
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  B3Dialog,
} from '@/components'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  snackbar,
} from '@/utils'

import {
  AddressItemType,
} from '../../../types/address'

import {
  deleteB2BAddress,
  deleteBCCustomerAddress,
} from '@/shared/service/b2b'

interface DeleteAddressDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  addressData?: AddressItemType
  updateAddressList: (isFirst?: boolean) => void
}

export const DeleteAddressDialog = (props: DeleteAddressDialogProps) => {
  const {
    isOpen,
    setIsOpen,
    addressData,
    updateAddressList,
    setIsLoading,
  } = props

  const [isMobile] = useMobile()

  const {
    state: {
      isB2BUser,
      companyInfo: {
        id: companyId,
      },
    },
  } = useContext(GlobaledContext)

  const handleDelete = async () => {
    if (!addressData) {
      return
    }

    try {
      setIsLoading(true)
      setIsOpen(false)

      const {
        id = '',
        bcAddressId = '',
      } = addressData

      if (isB2BUser) {
        await deleteB2BAddress({
          addressId: id,
          companyId,
        })
      } else {
        await deleteBCCustomerAddress({
          bcAddressId,
        })
      }

      snackbar.success('Successfully deleted')

      updateAddressList()
    } catch (e) {
      setIsLoading(false)
    }
  }

  return (
    <B3Dialog
      isOpen={isOpen}
      title="Delete address? "
      leftSizeBtn="cancel"
      rightSizeBtn="delete"
      handleLeftClick={() => { setIsOpen(false) }}
      handRightClick={handleDelete}
      rightStyleBtn={{
        color: '#D32F2F',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: `${isMobile ? 'center%' : 'start'}`,
          width: `${isMobile ? '100%' : '450px'}`,
          height: '100%',
        }}
      >
        Are you sure you want to delete this address?
      </Box>
    </B3Dialog>
  )
}
