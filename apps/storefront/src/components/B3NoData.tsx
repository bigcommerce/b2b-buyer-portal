import {
  DataUsageRounded,
} from '@mui/icons-material'

import styled from '@emotion/styled'

interface B3NoDataProps {
  text?: string
  backgroundColor?: string
}

const NoDataContainer = styled('div')(({
  backgroundColor = '#fff',
}: B3NoDataProps) => ({
  height: '100%',
  backgroundColor,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#aaa',
  fontSize: '18px',
}))

const NoDataText = styled('span')(() => ({
  marginLeft: '10px',
}))

export const B3NoData = ({
  text,
  backgroundColor,
}: B3NoDataProps) => (
  <NoDataContainer backgroundColor={backgroundColor}>
    <DataUsageRounded fontSize="large" />
    <NoDataText>{text || 'No Data'}</NoDataText>
  </NoDataContainer>
)
