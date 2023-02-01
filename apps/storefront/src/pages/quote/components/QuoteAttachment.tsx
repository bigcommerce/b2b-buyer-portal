import {
  Card,
  CardContent,
  Box,
} from '@mui/material'

import {
  useState,
  useEffect,
} from 'react'

import {
  B3CollapseContainer,
} from '@/components'

import {
  B3LStorage,
} from '@/utils'

export const QuoteAttachment = () => {
  const [fileInfo, setFileInfo] = useState('')

  useEffect(() => {
    // const {
    //   fileInfo = '',
    // } = B3LStorage.get('MyQuoteInfo') || {}

    setFileInfo('file')
  }, [])

  useEffect(() => {
    const quoteInfo = B3LStorage.get('MyQuoteInfo')

    if (quoteInfo) {
      B3LStorage.set('MyQuoteInfo', {
        ...quoteInfo,
        fileInfo,
      })
    }
  }, [fileInfo])

  return (
    <Card>
      <CardContent>
        <B3CollapseContainer title="Attachment">
          <Box sx={{
            padding: '16px 0',
          }}
          >
            {fileInfo}
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
