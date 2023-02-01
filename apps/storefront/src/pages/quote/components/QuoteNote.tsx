import {
  Card,
  CardContent,
  TextField,
  Box,
} from '@mui/material'

import {
  useState,
  ChangeEvent,
  useEffect,
} from 'react'

import {
  B3CollapseContainer,
} from '@/components'

import {
  B3LStorage,
} from '@/utils'

export const QuoteNote = () => {
  const [noteText, setNoteText] = useState('')

  const handleNoteTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNoteText(event?.target.value || '')
  }

  useEffect(() => {
    const {
      note = '',
    } = B3LStorage.get('MyQuoteInfo') || {}

    setNoteText(note)
  }, [])

  useEffect(() => {
    const quoteInfo = B3LStorage.get('MyQuoteInfo') || {}

    B3LStorage.set('MyQuoteInfo', {
      ...quoteInfo,
      note: noteText,
    })
  }, [noteText])

  return (
    <Card>
      <CardContent>
        <B3CollapseContainer title="Note">
          <Box sx={{
            padding: '16px 0',
          }}
          >
            <TextField
              multiline
              fullWidth
              rows={5}
              value={noteText}
              onChange={handleNoteTextChange}
            />
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
