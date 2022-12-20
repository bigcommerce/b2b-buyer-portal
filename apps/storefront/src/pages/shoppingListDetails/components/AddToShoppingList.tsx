import {
  Card,
  CardContent,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  B3Dialog,
} from '@/components'

import {
  AddToListContent,
} from './AddToListContent'

interface AddToShoppingListProps {
  open: boolean,
  updateList: () => void,
  onAddToListCancel: () => void,
}

export const AddToShoppingList = (props: AddToShoppingListProps) => {
  const {
    open,
    updateList,
    onAddToListCancel,
  } = props

  const [isMobile] = useMobile()

  return (isMobile ? (
    <B3Dialog
      isOpen={open}
      showRightBtn={false}
      handleLeftClick={onAddToListCancel}
    >
      <AddToListContent updateList={updateList} />
    </B3Dialog>
  ) : (
    <Card>
      <CardContent>
        <AddToListContent updateList={updateList} />
      </CardContent>
    </Card>
  )

  )
}
