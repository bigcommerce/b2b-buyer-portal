import styled from '@emotion/styled';
import { DataUsageRounded } from '@mui/icons-material';

import { useB3Lang } from '@/lib/lang';

const NoDataContainer = styled('div')(() => ({
  height: '100%',
  minHeight: '400px',
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#aaa',
  fontSize: '18px',
}));

const NoDataText = styled('span')(() => ({
  marginLeft: '10px',
}));

export default function B3NoData() {
  const b3Lang = useB3Lang();

  return (
    <NoDataContainer>
      <DataUsageRounded fontSize="large" />
      <NoDataText>{b3Lang('global.table.noData')}</NoDataText>
    </NoDataContainer>
  );
}
