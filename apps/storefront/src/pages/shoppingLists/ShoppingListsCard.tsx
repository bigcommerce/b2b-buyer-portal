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
  format,
} from 'date-fns'

import {
  ShoppingListsItemsProps,
} from './config'

import {
  ShoppingStatus,
} from './ShoppingStatus'

export interface OrderItemCardProps {
  item: ShoppingListsItemsProps,
  onEdit: (data: ShoppingListsItemsProps) => void
  onDelete: (data: ShoppingListsItemsProps) => void
  onCopy: (data: ShoppingListsItemsProps) => void
  isPermissions: boolean
  role: number | string
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

const ShoppingListsCard = (props: OrderItemCardProps) => {
  const {
    item: shoppingList,
    onEdit,
    onDelete,
    onCopy,
    isPermissions,
    role,
  } = props

  const getPermissions = (status: number) => {
    if (role === 2) {
      if (status === 20 || status === 30) return false
      return true
    }

    return false
  }

  const navigate = useNavigate()

  const goToDetail = (shoppingList: ShoppingListsItemsProps) => navigate(`/shoppingList/${shoppingList.id}`)

  return (
    <Card
      key={shoppingList.id}
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
          {shoppingList.name}
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
            <ShoppingStatus status={shoppingList.status} />
          </Box>
          <Typography>
            {
              shoppingList.description
            }
          </Typography>

          <FlexItem>
            <FontBold>
              Created by:
            </FontBold>
            {shoppingList.customerInfo.firstName}
            {' '}
            {shoppingList.customerInfo.lastName}
          </FlexItem>
          <FlexItem>
            <FontBold>
              Products:
            </FontBold>
            {shoppingList.products.totalCount}
          </FlexItem>
          <FlexItem>
            <FontBold>
              Last activity:
            </FontBold>
            {format(+shoppingList.updatedAt * 1000, 'dd MMM yy')}
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
            onClick={() => goToDetail(shoppingList)}
          >
            View
          </Button>
          <Box
            sx={{
              display: `${isPermissions ? 'block' : 'none'}`,
            }}
          >
            {
              !getPermissions(shoppingList.status) && (
              <IconButton
                aria-label="edit"
                size="small"
                sx={{
                  marginRight: '8px',
                }}
                onClick={() => { onEdit(shoppingList) }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
              )
            }

            <IconButton
              aria-label="edit"
              size="small"
              sx={{
                marginRight: '8px',
              }}
              onClick={() => { onCopy(shoppingList) }}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
            {
              !getPermissions(shoppingList.status) && (
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => { onDelete(shoppingList) }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
              )
            }

          </Box>
        </Flex>
      </CardContent>
    </Card>
  )
}

export default ShoppingListsCard
