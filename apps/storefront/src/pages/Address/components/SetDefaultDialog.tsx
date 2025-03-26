import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Checkbox, FormControlLabel, FormGroup } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useMobile } from '@/hooks';
import { updateB2BAddress } from '@/shared/service/b2b';
import { snackbar } from '@/utils';

import { AddressItemType } from '../../../types/address';

interface SetDefaultDialogProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  addressData?: AddressItemType;
  updateAddressList: (isFirst?: boolean) => void;
  companyId: string | number;
}

export default function SetDefaultDialog(props: SetDefaultDialogProps) {
  const { isOpen, setIsOpen, setIsLoading, addressData, updateAddressList, companyId } = props;

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const [address, setAddress] = useState<AddressItemType>();

  useEffect(() => {
    setAddress(addressData);
  }, [addressData]);

  const handleChange =
    (key: 'isDefaultShipping' | 'isDefaultBilling') => (e: ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;

      if (address) {
        const newAddress = {
          ...address,
        };
        if (key === 'isDefaultShipping') {
          newAddress.isDefaultShipping = checked ? 1 : 0;
          newAddress.isShipping = checked ? 1 : newAddress.isShipping;
        }
        if (key === 'isDefaultBilling') {
          newAddress.isDefaultBilling = checked ? 1 : 0;
          newAddress.isBilling = checked ? 1 : newAddress.isShipping;
        }
        setAddress(newAddress);
      }
    };

  const handleSetDefault = async () => {
    try {
      setIsLoading(true);
      setIsOpen(false);

      await updateB2BAddress({
        ...address,
        companyId,
      });

      snackbar.success(b3Lang('addresses.setDefaultDialog.successfullySet'));

      updateAddressList();
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <B3Dialog
      isOpen={isOpen}
      title={b3Lang('addresses.setDefaultDialog.setDefaultAddress')}
      leftSizeBtn={b3Lang('addresses.setDefaultDialog.cancel')}
      rightSizeBtn="set"
      handleLeftClick={() => {
        setIsOpen(false);
      }}
      handRightClick={handleSetDefault}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: isMobile ? 'start' : 'center',
          justifyContent: isMobile ? 'center%' : 'start',
          width: isMobile ? '100%' : '450px',
          height: '100%',
        }}
      >
        {address && (
          <Box
            sx={{
              padding: !isMobile ? '10px 0' : '0',
            }}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={address.isDefaultShipping === 1}
                    onChange={handleChange('isDefaultShipping')}
                  />
                }
                label={b3Lang('addresses.setDefaultDialog.setDefaultShippingAddress')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={address.isDefaultBilling === 1}
                    onChange={handleChange('isDefaultBilling')}
                  />
                }
                label={b3Lang('addresses.setDefaultDialog.setDefaultBillingAddress')}
              />
            </FormGroup>
          </Box>
        )}
      </Box>
    </B3Dialog>
  );
}
