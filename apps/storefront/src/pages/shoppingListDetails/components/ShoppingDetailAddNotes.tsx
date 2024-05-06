import { useB3Lang } from '@b3/lang';
import { Box, TextField } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useMobile } from '@/hooks';

interface ShoppingDetailAddNotesProps {
  open: boolean;
  notes: string;
  setNotes: (value: string) => void;
  handleCancelAddNotesClick: () => void;
  handleAddItemNotesClick: () => void;
}

function ShoppingDetailAddNotes(props: ShoppingDetailAddNotesProps) {
  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();
  const { open, notes, setNotes, handleCancelAddNotesClick, handleAddItemNotesClick } = props;

  return (
    <B3Dialog
      isOpen={open}
      title={b3Lang('shoppingList.addItemNotes.title')}
      leftSizeBtn={b3Lang('shoppingList.addItemNotes.cancel')}
      rightSizeBtn={b3Lang('shoppingList.addItemNotes.save')}
      handleLeftClick={handleCancelAddNotesClick}
      handRightClick={handleAddItemNotesClick}
      isShowBordered={false}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: `${isMobile ? 'center%' : 'start'}`,
          width: `${isMobile ? '100%' : '450px'}`,
          height: '100%',
        }}
      >
        <TextField
          multiline
          rows={6}
          defaultValue={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="filled"
          fullWidth
          placeholder={b3Lang('shoppingList.addItemNotes.placeholder')}
        />
      </Box>
    </B3Dialog>
  );
}

export default ShoppingDetailAddNotes;
