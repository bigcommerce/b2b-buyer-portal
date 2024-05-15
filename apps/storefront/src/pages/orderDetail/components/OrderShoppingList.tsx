import { useEffect, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import AddIcon from '@mui/icons-material/Add'
import { Box, ListItemText, MenuItem, MenuList, useTheme } from '@mui/material'

import B3Dialog from '@/components/B3Dialog'
import CustomButton from '@/components/button/CustomButton'
import { b3HexToRgb } from '@/components/outSideComponents/utils/b3CustomStyles'
import B3Sping from '@/components/spin/B3Sping'
import { useMobile } from '@/hooks'
import { getB2BShoppingList, getBcShoppingList } from '@/shared/service/b2b'
import { isB2BUserSelector, useAppSelector } from '@/store'
import { channelId } from '@/utils'

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
  const b3Lang = useB3Lang()
  const {
    isOpen,
    dialogTitle = b3Lang('global.orderShoppingList.confirm'),
    confirmText = b3Lang('global.orderShoppingList.ok'),
    onClose = noop,
    onConfirm = noop,
    onCreate = noop,
    isLoading = false,
    setLoading = noop,
  } = props

  const isB2BUser = useAppSelector(isB2BUserSelector)
  const role = useAppSelector(({ company }) => company.customer.role)

  const theme = useTheme()
  const [isMobile] = useMobile()
  const primaryColor = theme.palette.primary.main

  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const getList = async () => {
      setLoading(true)
      setList([])

      const getShoppingList = isB2BUser ? getB2BShoppingList : getBcShoppingList
      const infoKey = isB2BUser ? 'shoppingLists' : 'customerShoppingLists'
      const params = isB2BUser ? {} : { channelId }

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

    getList()
    // Disabling as the setLoading dispatcher does not need to be here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isB2BUser, isOpen, role])

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
          />
          {` ${b3Lang('global.orderShoppingList.createNew')}`}
        </CustomButton>
      </B3Sping>
    </B3Dialog>
  )
}
