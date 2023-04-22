import { useEffect, useRef, useState } from 'react'
import { Box, Grid } from '@mui/material'

import { B3Dialog } from '@/components'
import { AddressItemType } from '@/types/address'

import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import { AddressItemCard } from './AddressItemCard'

type AddressItemProps = {
  node: AddressItemType
}

interface ChooseAddressProps {
  isOpen: boolean
  addressList: AddressItemProps[]
  closeModal: () => void
  handleChangeAddress: (address: AddressItemType) => void
}

interface RefProps {
  copyList: AddressItemType[]
}

function ChooseAddress({
  isOpen,
  closeModal,
  handleChangeAddress,
  addressList = [],
}: ChooseAddressProps) {
  const recordList = useRef<RefProps>({
    copyList: [],
  })

  const [list, setList] = useState<AddressItemType[]>([])

  useEffect(() => {
    if (addressList.length) {
      const newList = addressList.map((item: AddressItemProps) => item.node)
      recordList.current.copyList = newList
      setList(newList)
    }
  }, [addressList])

  const keys = [
    'address',
    'firstName',
    'lastName',
    'phoneNumber',
    'state',
    'zipCode',
    'country',
    'label',
    'address',
    'addressLine1',
  ]

  const handleSearchProduct = (q: string) => {
    if (!q && recordList?.current) {
      setList(recordList.current.copyList)
      return
    }
    const newList: AddressItemType[] = []
    keys.forEach((key: string) => {
      let flag = true
      list.forEach((item: AddressItemType) => {
        if (item[key].includes(q) && flag) {
          newList.push(item)
          flag = false
        }
      })
    })
    setList(newList)
  }

  const handleCancelClicked = () => {
    closeModal()
  }

  return (
    <B3Dialog
      fullWidth
      isOpen={isOpen}
      handleLeftClick={handleCancelClicked}
      title="Choose from saved"
      showRightBtn={false}
      maxWidth="lg"
    >
      <Box>
        <B3FilterSearch
          searchBGColor="rgba(0, 0, 0, 0.06)"
          placeholder="Search address"
          handleChange={(e) => {
            handleSearchProduct(e)
          }}
        />
      </Box>
      <Box
        sx={{
          mt: '20px',
        }}
      >
        <Grid container spacing={2}>
          {list.map((addressItem: AddressItemType) => (
            <Grid item key={addressItem.id} xs={4}>
              <AddressItemCard
                item={addressItem}
                onSetAddress={handleChangeAddress}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </B3Dialog>
  )
}

export default ChooseAddress
