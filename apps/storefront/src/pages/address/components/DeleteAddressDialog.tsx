import { Dispatch, SetStateAction } from 'react'
import { Box } from '@mui/material'

import { B3Dialog } from '@/components'
import { useMobile } from '@/hooks'
import { deleteB2BAddress, deleteBCCustomerAddress } from '@/shared/service/b2b'
import { snackbar } from '@/utils'

import { AddressItemType } from '../../../types/address'

interface DeleteAddressDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  addressData?: AddressItemType
  updateAddressList: (isFirst?: boolean) => void
  companyId: string | number
  isBCPermission: boolean
}

export default function DeleteAddressDialog(props: DeleteAddressDialogProps) {
  const {
    isOpen,
    setIsOpen,
    addressData,
    updateAddressList,
    setIsLoading,
    companyId,
    isBCPermission,
  } = props

  const [isMobile] = useMobile()

  const handleDelete = async () => {
    if (!addressData) {
      return
    }

    try {
      setIsLoading(true)
      setIsOpen(false)

      const { id = '', bcAddressId = '' } = addressData

      if (!isBCPermission) {
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
      title="Delete address"
      leftSizeBtn="cancel"
      rightSizeBtn="delete"
      handleLeftClick={() => {
        setIsOpen(false)
      }}
      handRightClick={handleDelete}
      rightStyleBtn={{
        color: '#D32F2F',
      }}
      isShowBordered={false}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: `${isMobile ? 'start' : 'center'}`,
          justifyContent: `${isMobile ? 'center' : 'start'}`,
          width: `${isMobile ? '100%' : '450px'}`,
          height: '100%',
        }}
      >
        Are you sure you want to delete this address?
      </Box>
    </B3Dialog>
  )
}
