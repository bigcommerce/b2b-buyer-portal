import { lazy, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { LangFormatFunction, useB3Lang } from '@b3/lang';
import { Box } from '@mui/material';

import { isB2BUserSelector, useAppSelector } from '@/store';
import createShoppingList from '@/utils/b3ShoppingList/b3ShoppingList';

const B3Dialog = lazy(() => import('../../../components/B3Dialog'));
const B3CustomForm = lazy(() => import('../../../components/B3CustomForm'));
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
  const role = useAppSelector(({ company }) => company.customer.role);

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
        role: +role,
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
        isOpen={open}
        fullWidth
        title={b3Lang('global.createShoppingList.createNew')}
        loading={loading}
        handleLeftClick={handleClose}
        handRightClick={handleConfirm}
      >
        <Box
          sx={{
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <B3CustomForm
            formFields={getList(b3Lang)}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      </B3Dialog>
    </Box>
  );
}

export default CreateShoppingList;
