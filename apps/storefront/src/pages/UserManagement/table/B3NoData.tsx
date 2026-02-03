import styled from '@emotion/styled';
import { DataUsageRounded } from '@mui/icons-material';

import { useB3Lang } from '@/lib/lang';

interface B3NoDataProps {
  isLoading: boolean;
}

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

export default function B3NoData({ isLoading }: B3NoDataProps) {
  const b3Lang = useB3Lang();

  return (
    <NoDataContainer>
      {!isLoading && <DataUsageRounded fontSize="large" />}
      <NoDataText>{isLoading ? '' : b3Lang('global.table.noData')}</NoDataText>
    </NoDataContainer>
  );
}
