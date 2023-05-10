import { useContext, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import { Box, ListItemText, MenuItem, MenuList, useTheme } from '@mui/material'

import { B3Dialog, B3Sping, CustomButton } from '@/components'
import { b3HexToRgb } from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import { getB2BShoppingList, getBcShoppingList } from '@/shared/service/b2b'

import { ShoppingListItem } from '../../../types'

interface OrderShoppingListProps {
  isOpen: boolean
  dialogTitle?: string
  confirmText?: string
  onClose?: () => void
  onCreate?: () => void
  onConfirm?: (id: string) => void
  isLoading?: boolean
  setLoading?: (val: boolean) => void
}

interface ListItem {
  node: ShoppingListItem
}

const noop = () => {}

export default function OrderShoppingList(props: OrderShoppingListProps) {
  const {
    isOpen,
    dialogTitle = 'Confirm',
    confirmText = 'OK',
    onClose = noop,
    onConfirm = noop,
    onCreate = noop,
    isLoading = false,
    setLoading = noop,
  } = props

  const {
    state: { isB2BUser, currentChannelId, role },
  } = useContext(GlobaledContext)

  const theme = useTheme()
  const [isMobile] = useMobile()
  const primaryColor = theme.palette.primary.main

  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState('')

  const getList = async () => {
    setLoading(true)
    setList([])

    const getShoppingList = isB2BUser ? getB2BShoppingList : getBcShoppingList
    const infoKey = isB2BUser ? 'shoppingLists' : 'customerShoppingLists'
    const params = isB2BUser
      ? {}
      : {
          channelId: currentChannelId,
        }

    try {
      const {
        [infoKey]: { edges: list = [] },
      }: CustomFieldItems = await getShoppingList(params)

      if (!isB2BUser) {
        setList(list)
      } else {
        const newList = list.filter(
          (item: CustomFieldItems) =>
            item.node.status === +(role === 2 ? 30 : 0)
        )
        setList(newList)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      getList()
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
  }

  const handleConfirm = () => {
    onConfirm(activeId)
  }

  const handleCreate = () => {
    onCreate()
  }

  const handleListItemClicked = (item: ListItem) => () => {
    setActiveId(item.node.id)
  }

  return (
    <B3Dialog
      fullWidth
      isOpen={isOpen}
      title={dialogTitle}
      disabledSaveBtn={!activeId}
      handleLeftClick={handleClose}
      handRightClick={handleConfirm}
      rightSizeBtn={confirmText}
    >
      <B3Sping isSpinning={isLoading} isFlex={false}>
        <Box
          sx={
            isMobile
              ? {
                  height: '430px',
                }
              : {
                  padding: isLoading ? '4rem 0' : 'unset',
                  maxHeight: '430PX',
                }
          }
        >
          <MenuList
            sx={{
              maxHeight: '400px',
              width: '100%',
              overflowY: 'auto',
            }}
          >
            {list.map((item: ListItem) => (
              <MenuItem
                key={item.node.id}
                className={activeId === item.node.id ? 'active' : ''}
                onClick={handleListItemClicked(item)}
                sx={{
                  '&:hover': {
                    backgroundColor: b3HexToRgb(primaryColor, 0.12),
                  },
                  '&.active': {
                    backgroundColor: b3HexToRgb(primaryColor, 0.12),
                  },
                }}
              >
                <ListItemText>{item.node.name}</ListItemText>
              </MenuItem>
            ))}
          </MenuList>
        </Box>

        <CustomButton
          variant="text"
          onClick={handleCreate}
          sx={{
            textTransform: 'none',
          }}
        >
          <AddIcon
            sx={{
              fontSize: '17px',
            }}
          />{' '}
          Create new
        </CustomButton>
      </B3Sping>
    </B3Dialog>
  )
}
