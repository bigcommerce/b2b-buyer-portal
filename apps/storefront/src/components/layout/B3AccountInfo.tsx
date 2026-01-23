import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';

import B3DropDown, { ListItemProps } from '../B3DropDown';

type ListProps = Record<string, string>;

const list: ListProps[] = [
  {
    name: 'Log out',
    key: 'logout',
    idLang: 'global.button.logout',
  },
];

interface B3AccountInfoProps {
  closeSidebar?: (x: boolean) => void;
}

export default function B3AccountInfo({ closeSidebar }: B3AccountInfoProps) {
  const [isMobile] = useMobile();

  const firstName = useAppSelector(({ company }) => company.customer.firstName);
  const lastName = useAppSelector(({ company }) => company.customer.lastName);

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const handleItemClick = async (key: string | number) => {
    const item = list.find((v) => v.key === key);

    if (!item) {
      return;
    }

    if (item.key === 'logout') {
      navigate('/login?loginFlag=loggedOutLogin');
    } else if (item.type === 'path' && item.key) {
      navigate(item.key);
    }

    if (closeSidebar) {
      closeSidebar(false);
    }
  };

  const name = `${firstName}  ${lastName}`;

  const newList: ListItemProps[] = useMemo(
    () =>
      list.map((item) => ({
        key: item.key,
        name: b3Lang(item.idLang),
      })),
    [b3Lang],
  );

  return (
    <Box
      sx={{
        minWidth: '150px',
        display: 'flex',
        justifyContent: isMobile ? 'start' : 'end',
        mr: '-5px',
        fontSize: '16px',
        color: '#333333',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      <B3DropDown handleItemClick={handleItemClick} list={newList} title={name} />
    </Box>
  );
}
