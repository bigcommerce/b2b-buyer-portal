import { useB3Lang } from '@b3/lang'
import styled from '@emotion/styled'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Theme, useTheme } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { B3Tag, CustomButton } from '@/components'

import { AddressItemType } from '../../../types/address'

export interface OrderItemCardProps {
  item: AddressItemType
  onEdit: (data: AddressItemType) => void
  onDelete: (data: AddressItemType) => void
  onSetDefault: (data: AddressItemType) => void
  editPermission: boolean
  isBCPermission: boolean
}

interface TagBoxProps {
  marginBottom: number | string
}

const TagBox = styled('div')(({ marginBottom }: TagBoxProps) => ({
  marginBottom,
  '& > span:not(:last-child)': {
    marginRight: '4px',
  },
}))

interface FlexProps {
  theme?: Theme
}

const Flex = styled('div')(({ theme }: FlexProps) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme!.spacing(3),
}))

export function AddressItemCard(props: OrderItemCardProps) {
  const {
    item: addressInfo,
    onEdit,
    onDelete,
    onSetDefault,
    editPermission: hasPermission,
    isBCPermission,
  } = props

  const theme = useTheme()
  const b3Lang = useB3Lang()

  return (
    <Card key={addressInfo.id}>
      <CardContent
        sx={{
          color: '#313440',
          wordBreak: 'break-word',
        }}
      >
        {addressInfo.label && (
          <Typography
            variant="h5"
            sx={{
              marginBottom:
                addressInfo.isDefaultShipping === 1 ||
                addressInfo.isDefaultBilling === 1
                  ? theme.spacing(1)
                  : theme.spacing(3),
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            {addressInfo.label}
          </Typography>
        )}

        <TagBox
          marginBottom={
            addressInfo.isDefaultShipping === 1 ||
            addressInfo.isDefaultBilling === 1
              ? theme.spacing(3)
              : 0
          }
        >
          {addressInfo.isDefaultShipping === 1 && (
            <B3Tag color="#C4DD6C" textColor="rgba(0, 0, 0, 0.87)">
              {b3Lang('addresses.addressItemCard.defaultShipping')}
            </B3Tag>
          )}
          {addressInfo.isDefaultBilling === 1 && (
            <B3Tag color="#C4DD6C" textColor="rgba(0, 0, 0, 0.87)">
              {b3Lang('addresses.addressItemCard.defaultBilling')}
            </B3Tag>
          )}
        </TagBox>

        <Typography variant="body1">{`${addressInfo.firstName} ${addressInfo.lastName}`}</Typography>
        <Typography variant="body1">{addressInfo.company || ''}</Typography>
        <Typography variant="body1">{addressInfo.addressLine1}</Typography>
        <Typography variant="body1">
          {addressInfo.addressLine2 === 'undefined'
            ? ''
            : addressInfo.addressLine2}
        </Typography>
        <Typography variant="body1">{`${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}, ${addressInfo.country}`}</Typography>
        <Typography variant="body1">{addressInfo.phoneNumber}</Typography>

        {hasPermission && (
          <Flex>
            {!isBCPermission && (
              <CustomButton
                variant="text"
                sx={{
                  ml: '-8px',
                }}
                onClick={() => {
                  onSetDefault(addressInfo)
                }}
              >
                {b3Lang('addresses.addressItemCard.setAsDefault')}
              </CustomButton>
            )}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <IconButton
                aria-label="edit"
                size="small"
                sx={{
                  marginRight: '8px',
                }}
                onClick={() => {
                  onEdit(addressInfo)
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => {
                  onDelete(addressInfo)
                }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </Flex>
        )}
      </CardContent>
    </Card>
  )
}
