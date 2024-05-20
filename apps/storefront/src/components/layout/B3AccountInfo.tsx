import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useMobile } from '@/hooks';
import { useAppSelector } from '@/store';

import B3DropDown from '../B3DropDown';

interface ListProps {
  [key: string]: string;
}

const list: Array<ListProps> = [
  {
    name: 'Log out',
    key: 'logout',
    type: 'button',
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

  const handleItemClick = async (item: ListProps) => {
    if (item.key === 'logout') {
      navigate('/login?loginFlag=3');
    } else if (item.type === 'path' && item.key) {
      navigate(item.key);
    }
    if (closeSidebar) {
      closeSidebar(false);
    }
  };

  const name = `${firstName}  ${lastName}`;

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
      <B3DropDown title={name} handleItemClick={handleItemClick} list={list} />
    </Box>
  );
}
