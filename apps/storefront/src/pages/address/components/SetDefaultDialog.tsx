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
  useMobile,
} from '@/hooks'

import {
  B3Dialog,
} from '@/components'

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
  setIsLoading: Dispatch<SetStateAction<boolean>>
  addressData?: AddressItemType
  updateAddressList: (isFirst?: boolean) => void
}

export const SetDefaultDialog = (props: SetDefaultDialogProps) => {
  const {
    isOpen,
    setIsOpen,
    setIsLoading,
    addressData,
    updateAddressList,
  } = props

  const [isMobile] = useMobile()

  const {
    state: {
      companyInfo: {
        id: companyId,
      },
    },
  } = useContext(GlobaledContext)

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
      setIsOpen(false)

      await updateB2BAddress({
        ...address,
        companyId,
      })

      updateAddressList()
    } catch (e) {
      setIsLoading(false)
    }
  }

  return (
    <B3Dialog
      isOpen={isOpen}
      title="Set as default address"
      leftSizeBtn="cancel"
      rightSizeBtn="set"
      handleLeftClick={() => { setIsOpen(false) }}
      handRightClick={handleSetDefault}
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
        {
        address && (
          <Box
            sx={{
              padding: !isMobile ? '10px 0' : '0',
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
      </Box>
    </B3Dialog>
  )
}
