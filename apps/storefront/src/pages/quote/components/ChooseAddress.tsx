import { useEffect, useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Grid } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import B3FilterSearch from '@/components/filter/B3FilterSearch';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { AddressItemType } from '@/types/address';

import { AddressItemCard } from './AddressItemCard';

type AddressItemProps = {
  node: AddressItemType;
};

interface ChooseAddressProps {
  isOpen: boolean;
  addressList: AddressItemProps[];
  closeModal: () => void;
  handleChangeAddress: (address: AddressItemType) => void;
  type: string;
}

interface RefProps {
  copyList: AddressItemType[];
}

function ChooseAddress({
  isOpen,
  closeModal,
  handleChangeAddress,
  addressList = [],
  type,
}: ChooseAddressProps) {
  const recordList = useRef<RefProps>({
    copyList: [],
  });
  const b3Lang = useB3Lang();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const [list, setList] = useState<AddressItemType[]>([]);

  useEffect(() => {
    if (addressList.length) {
      const allList = addressList.map((item: AddressItemProps) => item.node);
      const newList = allList.filter(
        (item) =>
          (item.isShipping === 1 && type === 'shipping') ||
          (item.isBilling === 1 && type === 'billing'),
      );
      recordList.current.copyList = isB2BUser ? newList : allList;
      setList(newList);
    }
  }, [addressList, type, isB2BUser]);

  const keys = [
    'address',
    'firstName',
    'lastName',
    'phoneNumber',
    'state',
    'zipCode',
    'country',
    'label',
    'address',
    'addressLine1',
  ];

  const handleSearchProduct = (q: string) => {
    if (!q && recordList?.current) {
      setList(recordList.current.copyList);
      return;
    }
    const newList: AddressItemType[] = [];
    keys.forEach((key: string) => {
      let flag = true;
      list.forEach((item: AddressItemType) => {
        if (item[key].includes(q) && flag) {
          newList.push(item);
          flag = false;
        }
      });
    });
    setList(newList);
  };

  const handleCancelClicked = () => {
    closeModal();
  };

  return (
    <B3Dialog
      fullWidth
      isOpen={isOpen}
      handleLeftClick={handleCancelClicked}
      title={b3Lang('quoteDraft.chooseAddress.chooseFromSaved')}
      showRightBtn={false}
      maxWidth="lg"
    >
      <Box>
        <B3FilterSearch
          searchBGColor="rgba(0, 0, 0, 0.06)"
          placeholder={b3Lang('quoteDraft.chooseAddress.searchAddress')}
          handleChange={(e) => {
            handleSearchProduct(e);
          }}
        />
      </Box>
      <Box
        sx={{
          mt: '20px',
        }}
      >
        <Grid container spacing={2}>
          {list.map((addressItem: AddressItemType) => (
            <Grid item key={addressItem.id} xs={4}>
              <AddressItemCard item={addressItem} onSetAddress={handleChangeAddress} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </B3Dialog>
  );
}

export default ChooseAddress;
