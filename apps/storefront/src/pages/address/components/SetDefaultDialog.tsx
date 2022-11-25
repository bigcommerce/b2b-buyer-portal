import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useContext,
} from 'react'

import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'

import {
  B3ConfirmDialog,
} from '@/components/B3ConfirmDialog'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  updateB2BAddress,
} from '@/shared/service/b2b'

import {
  AddressItemType,
} from '../../../types/address'

interface SetDefaultDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  addressData?: AddressItemType
  updateAddressList: (isFirst?: boolean) => void
}

export const SetDefaultDialog = (props: SetDefaultDialogProps) => {
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

  const [address, setAddress] = useState<AddressItemType>()

  useEffect(() => {
    setAddress(addressData)
  }, [addressData])

  const handleChange = (key: 'isDefaultShipping' | 'isDefaultBilling') => (e: ChangeEvent<HTMLInputElement>) => {
    const {
      checked,
    } = e.target

    if (address) {
      const newAddress = {
        ...address,
      }
      if (key === 'isDefaultShipping') {
        newAddress.isDefaultShipping = checked ? 1 : 0
        newAddress.isShipping = checked ? 1 : newAddress.isShipping
      }
      if (key === 'isDefaultBilling') {
        newAddress.isDefaultBilling = checked ? 1 : 0
        newAddress.isBilling = checked ? 1 : newAddress.isShipping
      }
      setAddress(newAddress)
    }
  }

  const handleSetDefault = async () => {
    try {
      setIsLoading(true)

      if (isB2BUser) {
        await updateB2BAddress({
          ...address,
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
      confirmText="Set"
      isShowCloseIcon={false}
      isConfirmDisabled={isLoading}
      isOpen={isOpen}
      fullWidth={false}
      onClose={() => { setIsOpen(false) }}
      onConfirm={handleSetDefault}
      isSpinning={isLoading}
    >
      {
        address && (
          <Box
            sx={{
              padding: '30px',
              minWidth: '420px',
            }}
          >
            <FormGroup>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={address.isDefaultShipping === 1}
                    onChange={handleChange('isDefaultShipping')}
                  />
            )}
                label="Set as default shipping address "
              />
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={address.isDefaultBilling === 1}
                    onChange={handleChange('isDefaultBilling')}
                  />
            )}
                label="Set as default billing address "
              />
            </FormGroup>
          </Box>
        )
      }
    </B3ConfirmDialog>
  )
}
