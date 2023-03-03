import {
  useState,
  useEffect,
  useContext,
} from 'react'

import {
  Box,
  MenuList,
  Button,
  MenuItem,
  ListItemText,
} from '@mui/material'

import styled from '@emotion/styled'

import {
  getB2BShoppingList,
  getBcShoppingList,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Dialog,
} from '@/components'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  ShoppingListItem,
} from '../../../types'

const ShoppingListMenuItem = styled(MenuItem)(() => ({
  '&:hover': {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
  },
  '&.active': {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
  },
}))

interface orderShoppingListProps {
  isOpen: boolean,
  dialogTitle?: string,
  confirmText?: string,
  onClose?: () => void,
  onCreate?: () => void,
  onConfirm?: (id: string) => void,
  isLoading?: boolean,
  setLoading?: (val: boolean) => void,
}

interface ListItem {
  node: ShoppingListItem
}

const noop = () => {}

export const OrderShoppingList = (props: orderShoppingListProps) => {
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
    state: {
      isB2BUser,
      currentChannelId,
    },
  } = useContext(GlobaledContext)

  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState('')

  const getList = async () => {
    setLoading(true)
    setList([])

    const getShoppingList = isB2BUser ? getB2BShoppingList : getBcShoppingList
    const infoKey = isB2BUser ? 'shoppingLists' : 'customerShoppingLists'
    const params = isB2BUser ? {} : {
      channelId: currentChannelId,
    }

    try {
      const {
        [infoKey]: {
          edges: list = [],
        },
      }: CustomFieldItems = await getShoppingList(params)

      const newList = list.filter((item: CustomFieldItems) => (isB2BUser ? item.node.status === 0 : true))

      setList(newList)
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
      <B3Sping
        isSpinning={isLoading}
        isFlex={false}
      >
        <Box
          sx={{
            height: '430px',
          }}
        >
          <MenuList
            sx={{
              maxHeight: '400px',
              width: '100%',
              overflowY: 'auto',
            }}
          >
            {
              list.map((item: ListItem) => (
                <ShoppingListMenuItem
                  key={item.node.id}
                  className={activeId === item.node.id ? 'active' : ''}
                  onClick={handleListItemClicked(item)}
                >
                  <ListItemText>
                    {item.node.name}
                  </ListItemText>
                </ShoppingListMenuItem>
              ))
            }
          </MenuList>
        </Box>

        <Button
          variant="text"
          onClick={handleCreate}
          sx={{
            textTransform: 'none',
          }}
        >
          + Create New
        </Button>
      </B3Sping>
    </B3Dialog>
  )
}
