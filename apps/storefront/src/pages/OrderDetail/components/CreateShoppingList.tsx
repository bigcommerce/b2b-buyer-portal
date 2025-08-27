import { LangFormatFunction, useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import { isB2BUserSelector, useAppSelector } from '@/store';
import createShoppingList from '@/utils/b3ShoppingList/b3ShoppingList';

const getList = (b3Lang: LangFormatFunction) => [
  {
    name: 'name',
    label: b3Lang('global.createShoppingList.name'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    maxLength: 200,
  },
  {
    name: 'description',
    label: b3Lang('global.createShoppingList.description'),
    required: false,
    default: '',
    fieldType: 'multiline',
    xs: 12,
    variant: 'filled',
    size: 'small',
    rows: 4,
    maxLength: 200,
  },
];

interface CreateShoppingListProps {
  open: boolean;
  onChange: () => void;
  onClose: () => void;
}

function CreateShoppingList({ open, onChange, onClose }: CreateShoppingListProps) {
  const container = useRef<HTMLInputElement | null>(null);

  const b3Lang = useB3Lang();

  const [loading, setLoading] = useState<boolean>(false);

  const isB2BUser = useAppSelector(isB2BUserSelector);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  });

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    handleSubmit(async (data) => {
      const { name, description } = data;

      setLoading(true);
      await createShoppingList({
        data: { name, description },
        isB2BUser,
      });
      setLoading(false);
      onChange();
    })();
  };

  return (
    <Box
      sx={{
        ml: 3,
        cursor: 'pointer',
        width: '50%',
      }}
    >
      <Box ref={container} />

      <B3Dialog
        fullWidth
        handRightClick={handleConfirm}
        handleLeftClick={handleClose}
        isOpen={open}
        loading={loading}
        title={b3Lang('global.createShoppingList.createNew')}
      >
        <Box
          sx={{
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <B3CustomForm
            control={control}
            errors={errors}
            formFields={getList(b3Lang)}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      </B3Dialog>
    </Box>
  );
}

export default CreateShoppingList;
