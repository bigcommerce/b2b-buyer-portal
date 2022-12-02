import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import styled from '@emotion/styled'

import {
  useTheme,
  Theme,
} from '@mui/material'

import {
  AddressItemType,
} from '../../../types/address'

import {
  B3Tag,
} from '@/components/B3Tag'

export interface OrderItemCardProps {
  item: AddressItemType,
  onEdit: (data: AddressItemType) => void
  onDelete: (data: AddressItemType) => void
  onSetDefault: (data: AddressItemType) => void
  editPermission: boolean
  isBCPermission: boolean
}

interface TagBoxProps {
  marginBottom: number | string
}

const TagBox = styled('div')(({
  marginBottom,
}: TagBoxProps) => ({
  marginBottom,
  '& > span:not(:last-child)': {
    marginRight: '4px',
  },
}))

interface FlexProps {
  theme?: Theme
}

const Flex = styled('div')(({
  theme,
}: FlexProps) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme!.spacing(3),
}))

export const AddressItemCard = (props: OrderItemCardProps) => {
  const {
    item: addressInfo,
    onEdit,
    onDelete,
    onSetDefault,
    editPermission: hasPermission,
    isBCPermission,
  } = props

  const theme = useTheme()

  return (
    <Card
      key={addressInfo.id}
    >
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
              marginBottom: addressInfo.isDefaultShipping === 1 || addressInfo.isDefaultBilling === 1 ? theme.spacing(1) : theme.spacing(3),
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            {addressInfo.label}
          </Typography>
        )}

        <TagBox marginBottom={addressInfo.isDefaultShipping === 1 || addressInfo.isDefaultBilling === 1 ? theme.spacing(3) : 0}>
          { addressInfo.isDefaultShipping === 1 && (
            <B3Tag
              color="#C4DD6C"
              textColor="rgba(0, 0, 0, 0.87)"
            >
              Default shipping
            </B3Tag>
          )}
          { addressInfo.isDefaultBilling === 1 && (
            <B3Tag
              color="#C4DD6C"
              textColor="rgba(0, 0, 0, 0.87)"
            >
              Default billing
            </B3Tag>
          )}
        </TagBox>

        <Typography variant="body1">
          {`${addressInfo.firstName} ${addressInfo.lastName}`}
        </Typography>
        <Typography variant="body1">{addressInfo.company || ''}</Typography>
        <Typography variant="body1">{addressInfo.addressLine1}</Typography>
        <Typography variant="body1">{addressInfo.addressLine2}</Typography>
        <Typography variant="body1">
          {`${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}, ${addressInfo.country}`}
        </Typography>
        <Typography variant="body1">{addressInfo.phoneNumber}</Typography>

        {
          hasPermission && (
          <Flex>
            {
              !isBCPermission && (
                <Button
                  variant="text"
                  sx={{
                    padding: 0,
                  }}
                  onClick={() => { onSetDefault(addressInfo) }}
                >
                  Set as default
                </Button>
              )
            }
            <Box sx={{
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
                onClick={() => { onEdit(addressInfo) }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => { onDelete(addressInfo) }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </Flex>
          )
        }
      </CardContent>
    </Card>
  )
}
