import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import styled from '@emotion/styled'

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

import {
  CustomButton,
} from '@/components'

export interface OrderItemCardProps {
  item: ShoppingListsItemsProps,
  onEdit: (data: ShoppingListsItemsProps) => void
  onDelete: (data: ShoppingListsItemsProps) => void
  onCopy: (data: ShoppingListsItemsProps) => void
  isPermissions: boolean
  role: number | string
  isB2BUser: boolean
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
    isB2BUser,
  } = props

  const currentSLCreateRole = shoppingList?.customerInfo?.role

  const getEditPermissions = (status: number) => {
    if (+role === 2) {
      if (status === 30 || status === 0) return false
      return true
    }

    if (status === 40) return true

    return false
  }

  const getDeletePermissions = (status: number) => {
    if (+role === 2) {
      if (status === 20 || status === 30) return false
      return true
    }

    return false
  }

  const navigate = useNavigate()

  const goToDetail = (shoppingList: ShoppingListsItemsProps) => navigate(`/shoppingList/${shoppingList.id}`, {
    state: {
      from: 'shoppingList',
    },
  })

  return (
    <Card
      key={shoppingList.id}
      sx={{
        '.MuiCardContent-root': {
          pb: '18px',
        },
      }}
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
            width: '100%',
            wordBreak: 'break-all',
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
          {
            isB2BUser && +currentSLCreateRole === 2 && (
              <Box
                sx={{
                  pb: '25px',
                }}
              >
                <ShoppingStatus status={shoppingList.status} />
              </Box>
            )
          }
          <Box
            sx={{
              width: '100%',
              wordBreak: 'break-all',
            }}
          >
            {
              shoppingList.description
            }
          </Box>

          {
            isB2BUser && (
              <FlexItem>
                <FontBold>
                  Created by:
                </FontBold>
                {shoppingList.customerInfo.firstName}
                {' '}
                {shoppingList.customerInfo.lastName}
              </FlexItem>
            )
          }
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
            {format(+shoppingList.updatedAt * 1000, 'dd MMM yyyy')}
          </FlexItem>
        </Box>
        <Flex>
          <CustomButton
            sx={{
              m: '0 0 0 -8px',
              minWidth: 0,
              '&:hover': {
                backgroundColor: '#fff',
              },
            }}
            variant="text"
            onClick={() => goToDetail(shoppingList)}
          >
            View
          </CustomButton>
          <Box
            sx={{
              display: `${isPermissions ? 'block' : 'none'}`,
            }}
          >
            {
              !getEditPermissions(shoppingList.status) && (
              <IconButton
                aria-label="edit"
                size="medium"
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
              size="medium"
              sx={{
                marginRight: '8px',
              }}
              onClick={() => { onCopy(shoppingList) }}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
            {
              !getDeletePermissions(shoppingList.status) && (
              <IconButton
                aria-label="delete"
                size="medium"
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
