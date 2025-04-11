import { useB3Lang } from '@b3/lang';

import { B3Tag } from '@/components';
import { ShoppingListStatus } from '@/types/shoppingList';

interface Props {
  status: number | string;
}

export function ShoppingListStatusTag({ status }: Props) {
  const b3Lang = useB3Lang();

  const approveStatus = {
    value: ShoppingListStatus.Approved,
    label: b3Lang('global.shoppingLists.status.approved'),
    color: '#C4DD6C',
    textColor: 'black',
  };

  const readyForApprovalStatus = {
    value: ShoppingListStatus.ReadyForApproval,
    label: b3Lang('global.shoppingLists.status.readyForApproval'),
    color: '#F4CC46',
    textColor: 'black',
  };

  const draftStatus = {
    value: ShoppingListStatus.Draft,
    label: b3Lang('global.shoppingLists.status.draft'),
    color: '#899193',
    textColor: '#FFFFFF',
  };

  const rejectedStatus = {
    value: ShoppingListStatus.Rejected,
    label: b3Lang('global.shoppingLists.status.rejected'),
    color: '#7A6041',
    textColor: '#FFFFFF',
  };

  // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
  // Now when we want to fetch rejected shopping lists, we need to fetch deleted ones as well
  const deletedStatus = {
    value: ShoppingListStatus.Deleted,
    label: b3Lang('global.shoppingLists.status.rejected'),
    color: '#7A6041',
    textColor: '#FFFFFF',
  };

  const statusList = [
    approveStatus,
    readyForApprovalStatus,
    draftStatus,
    rejectedStatus,
    deletedStatus,
  ];
  const statusItem = statusList.find((item) => Number(item.value) === Number(status));

  if (statusItem) {
    return (
      <B3Tag color={statusItem.color} textColor={statusItem.textColor}>
        {statusItem.label}
      </B3Tag>
    );
  }

  return null;
}
