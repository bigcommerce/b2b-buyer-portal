import { useB3Lang } from '@b3/lang';

import { B3Tag } from '@/components';
import { rolePermissionSelector, useAppSelector } from '@/store';

import { getFilterShoppingListStatus } from './config';

interface NewStatusProps {
  label: string;
  value: string | number;
  color: string;
  textColor: string;
  idLang: string;
}

export const getStatus = (submitShoppingListPermission: boolean) => {
  const statusArr = getFilterShoppingListStatus(submitShoppingListPermission);

  const newStatus: Array<NewStatusProps> = statusArr.map((item) => {
    if (Number(item.value) === 0) {
      return {
        color: '#C4DD6C',
        textColor: 'black',
        ...item,
      };
    }

    if (Number(item.value) === 40) {
      return {
        color: '#F4CC46',
        textColor: 'black',
        ...item,
      };
    }

    if (Number(item.value) === 30) {
      return {
        color: '#899193',
        textColor: '#FFFFFF',
        ...item,
      };
    }
    return {
      color: '#7A6041',
      textColor: '#FFFFFF',
      ...item,
    };
  });

  return newStatus;
};

interface ShoppingStatusProps {
  status: number | string;
}

export function ShoppingStatus({ status }: ShoppingStatusProps) {
  const { submitShoppingListPermission } = useAppSelector(rolePermissionSelector);

  const b3Lang = useB3Lang();
  const statusList = getStatus(submitShoppingListPermission);
  const statusItem = statusList.find(
    (item: NewStatusProps) => Number(item.value) === Number(status),
  );

  if (statusItem) {
    return (
      <B3Tag color={statusItem.color} textColor={statusItem.textColor}>
        {b3Lang(statusItem.idLang)}
      </B3Tag>
    );
  }

  return null;
}
