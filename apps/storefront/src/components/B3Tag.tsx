import styled from '@emotion/styled'

interface TagContainerProps {
  color?: string,
  textColor?: string,
  padding?: string,
  fontSize?: string,
}

export const B3Tag = styled('span')(({
  color = '#2E7D32',
  textColor = '#fff',
  padding = '3px 10px',
  fontSize = '13px',
}: TagContainerProps) => ({
  padding,
  borderRadius: '16px',
  lineHeight: 1.4,
  backgroundColor: color,
  color: textColor,
  fontSize,
  whiteSpace: 'nowrap',
}))
