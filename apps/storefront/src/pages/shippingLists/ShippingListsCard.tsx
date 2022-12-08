import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import styled from '@emotion/styled'
import Button from '@mui/material/Button'

import {
  useNavigate,
} from 'react-router-dom'

import {
  ShippingListsItemsProps,
} from './config'

import {
  ShippingStatus,
} from './ShippingStatus'

export interface OrderItemCardProps {
  item: ShippingListsItemsProps,
  onEdit: (data: ShippingListsItemsProps) => void
  onDelete: (data: ShippingListsItemsProps) => void
  onCopy: (data: ShippingListsItemsProps) => void
  isPermissions: boolean
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}))

const FontBold = styled(Typography)(() => ({
  fontWeight: '500',
  paddingRight: '5px',
}))

const FlexItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'start',
}))

const ShippingListsCard = (props: OrderItemCardProps) => {
  const {
    item: shippingList,
    onEdit,
    onDelete,
    onCopy,
    isPermissions,
  } = props

  const navigate = useNavigate()

  const goToDetail = (shippingList: ShippingListsItemsProps) => navigate(`/shoppingList/${shippingList.id}`)

  return (
    <Card
      key={shippingList.id}
    >
      <CardContent
        sx={{
          color: '#313440',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(0, 0, 0, 0.87)',
          }}
        >
          {shippingList.name}
        </Typography>
        <Box
          sx={{
            pt: '8px',
            pb: '20px',
          }}
        >
          <Box
            sx={{
              pb: '25px',
            }}
          >
            <ShippingStatus status={shippingList.status} />
          </Box>
          <Typography>
            {
              shippingList.description
            }
          </Typography>

          <FlexItem>
            <FontBold>
              Created by:
            </FontBold>
            {shippingList.customerInfo.firstName}
            {' '}
            {shippingList.customerInfo.lastName}
          </FlexItem>
          <FlexItem>
            <FontBold>
              Products:
            </FontBold>
            {shippingList.products.totalCount}
          </FlexItem>
          <FlexItem>
            <FontBold>
              Last activity:
            </FontBold>
            {shippingList.name}
          </FlexItem>
        </Box>
        <Flex>
          <Button
            sx={{
              p: 0,
              m: 0,
              minWidth: 0,
            }}
            variant="text"
            onClick={() => goToDetail(shippingList)}
          >
            View
          </Button>
          <Box
            sx={{
              display: `${isPermissions ? 'block' : 'none'}`,
            }}
          >
            <IconButton
              aria-label="edit"
              size="small"
              sx={{
                marginRight: '8px',
              }}
              onClick={() => { onEdit(shippingList) }}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              aria-label="edit"
              size="small"
              sx={{
                marginRight: '8px',
              }}
              onClick={() => { onCopy(shippingList) }}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              aria-label="delete"
              size="small"
              onClick={() => { onDelete(shippingList) }}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </Box>
        </Flex>
      </CardContent>
    </Card>
  )
}

export default ShippingListsCard
