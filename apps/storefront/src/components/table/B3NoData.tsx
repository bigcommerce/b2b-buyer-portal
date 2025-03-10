import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { DataUsageRounded } from '@mui/icons-material';

interface B3NoDataProps {
  text?: string;
  backgroundColor?: string;
  minHeight?: string;
  isLoading?: boolean;
  showBorder?: boolean;
}

const NoDataContainer = styled('div')(
  ({ backgroundColor = '#fff', minHeight = '400px' }: B3NoDataProps) => ({
    height: '100%',
    minHeight,
    backgroundColor,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#aaa',
    fontSize: '18px',
  }),
);

const NoDataText = styled('span')(() => ({
  marginLeft: '10px',
}));

export default function B3NoData({
  text,
  backgroundColor,
  minHeight,
  showBorder = false,
  isLoading = false,
}: B3NoDataProps) {
  const b3Lang = useB3Lang();
  return (
    <NoDataContainer
      style={{
        boxShadow: showBorder
          ? '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)'
          : 'none',
      }}
      backgroundColor={backgroundColor}
      minHeight={minHeight}
    >
      {!isLoading && <DataUsageRounded fontSize="large" />}
      <NoDataText>{isLoading ? '' : text || b3Lang('global.table.noData')}</NoDataText>
    </NoDataContainer>
  );
}
