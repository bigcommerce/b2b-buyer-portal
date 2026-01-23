import { Box, TextField } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';

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
      handRightClick={handleAddItemNotesClick}
      handleLeftClick={handleCancelAddNotesClick}
      isOpen={open}
      isShowBordered={false}
      leftSizeBtn={b3Lang('shoppingList.addItemNotes.cancel')}
      rightSizeBtn={b3Lang('shoppingList.addItemNotes.save')}
      title={b3Lang('shoppingList.addItemNotes.title')}
    >
      <Box
        sx={{
          display: 'flex',
          width: isMobile ? '100%' : '450px',
          height: '100%',
        }}
      >
        <TextField
          defaultValue={notes}
          fullWidth
          multiline
          onChange={(e) => setNotes(e.target.value)}
          placeholder={b3Lang('shoppingList.addItemNotes.placeholder')}
          rows={6}
          variant="filled"
        />
      </Box>
    </B3Dialog>
  );
}

export default ShoppingDetailAddNotes;
