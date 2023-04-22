import styled from '@emotion/styled'
import { DataUsageRounded } from '@mui/icons-material'

interface B3NoDataProps {
  text?: string
  backgroundColor?: string
  minHeight?: string
  isLoading?: boolean
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
  })
)

const NoDataText = styled('span')(() => ({
  marginLeft: '10px',
}))

export default function B3NoData({
  text,
  backgroundColor,
  minHeight,
  isLoading = false,
}: B3NoDataProps) {
  return (
    <NoDataContainer backgroundColor={backgroundColor} minHeight={minHeight}>
      {!isLoading && <DataUsageRounded fontSize="large" />}
      <NoDataText>{isLoading ? '' : text || 'No data'}</NoDataText>
    </NoDataContainer>
  )
}
