import { Dispatch, SetStateAction } from 'react';
import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { deleteB2BAddress, deleteBCCustomerAddress } from '@/shared/service/b2b';
import { snackbar } from '@/utils/b3Tip';

import { AddressItemType } from '../../../types/address';

interface DeleteAddressDialogProps {
  isOpen: boolean;
  closeDialog: () => void;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  addressData?: AddressItemType;
  updateAddressList: (isFirst?: boolean) => void;
  companyId: string | number;
  isBCPermission: boolean;
}

export default function DeleteAddressDialog(props: DeleteAddressDialogProps) {
  const {
    isOpen,
    closeDialog,
    addressData,
    updateAddressList,
    setIsLoading,
    companyId,
    isBCPermission,
  } = props;

  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const handleDelete = async () => {
    if (!addressData) {
      return;
    }

    try {
      setIsLoading(true);
      closeDialog();

      const { id = '', bcAddressId = '' } = addressData;

      if (!isBCPermission) {
        await deleteB2BAddress({
          addressId: id,
          companyId,
        });
      } else {
        await deleteBCCustomerAddress({
          bcAddressId,
        });
      }

      snackbar.success(b3Lang('addresses.deleteAddressDialog.successfullyDeleted'));

      updateAddressList();
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <B3Dialog
      handRightClick={handleDelete}
      handleLeftClick={closeDialog}
      isOpen={isOpen}
      isShowBordered={false}
      leftSizeBtn={b3Lang('addresses.deleteAddressDialog.cancel')}
      rightSizeBtn={b3Lang('addresses.deleteAddressDialog.delete')}
      rightStyleBtn={{
        color: '#D32F2F',
      }}
      title={b3Lang('addresses.deleteAddressDialog.deleteAddress')}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: isMobile ? 'start' : 'center',
          justifyContent: isMobile ? 'center' : 'start',
          width: isMobile ? '100%' : '450px',
          height: '100%',
        }}
      >
        {b3Lang('addresses.deleteAddressDialog.confirmDelete')}
      </Box>
    </B3Dialog>
  );
}
