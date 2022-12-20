import {
  useState,
  useRef,
  useEffect,
  useContext,
} from 'react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  MenuList,
  Button,
  MenuItem,
  ListItemText,
  Divider,
} from '@mui/material'

import styled from '@emotion/styled'

import {
  useMobile,
} from '@/hooks'

import {
  getB2BShoppingList,
} from '@/shared/service/b2b'

import {
  ThemeFrameContext,
} from '@/components/ThemeFrame'

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

  const container = useRef<HTMLInputElement | null>(null)
  const [isMobile] = useMobile()

  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState('')

  const getList = async () => {
    setLoading(true)
    setList([])
    try {
      const {
        shoppingLists: {
          edges: list = [],
        },
      }: CustomFieldItems = await getB2BShoppingList()

      setList(list)
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

  const IframeDocument = useContext(ThemeFrameContext)
  useEffect(() => {
    if (IframeDocument) {
      IframeDocument.body.style.overflow = isOpen ? 'hidden' : 'initial'
      IframeDocument.body.style.paddingRight = isOpen ? '16px' : '0'
    }
  }, [isOpen, IframeDocument])

  return (
    <>
      <Box
        ref={container}
      />
      <Dialog
        open={isOpen}
        fullWidth
        container={container.current}
        onClose={handleClose}
        fullScreen={isMobile}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >

        <DialogTitle
          id="alert-dialog-title"
          sx={{
            borderBottom: '1px solid #D9DCE9',
          }}
        >
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <B3Sping
            isSpinning={isLoading}
            background="rgba(255,255,255,0.2)"
          >
            <MenuList
              sx={{
                minHeight: '200px',
                width: '100%',
              }}
            >
              {
              list.map((item: ListItem) => (
                <ShoppingListMenuItem
                  key={item.node.id}
                  className={activeId === item.node.id ? 'active' : ''}
                  onClick={handleListItemClicked(item)}
                >
                  <ListItemText>{item.node.name}</ListItemText>
                </ShoppingListMenuItem>
              ))
            }
            </MenuList>
          </B3Sping>

          <Button
            variant="text"
            onClick={handleCreate}
            sx={{
              textTransform: 'none',
            }}
          >
            + Create New
          </Button>
        </DialogContent>

        <Divider />

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!activeId}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </Button>
        </DialogActions>

      </Dialog>
    </>

  )
}
