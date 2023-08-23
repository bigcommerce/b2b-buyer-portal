import { ChangeEvent, useEffect, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box, Card, CardContent, TextField, Typography } from '@mui/material'

import { B3CollapseContainer } from '@/components'
import { B3LStorage } from '@/utils'

interface QuoteNoteProps {
  quoteStatus?: string | number
  quoteNotes?: string
}

export default function QuoteNote(props: QuoteNoteProps) {
  const b3Lang = useB3Lang()
  const { quoteStatus, quoteNotes = '' } = props

  const [noteText, setNoteText] = useState('')
  const [defaultOpen, setDefaultOpen] = useState(false)

  const handleNoteTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNoteText(event?.target.value || '')
  }

  useEffect(() => {
    const { note = '' } = B3LStorage.get('MyQuoteInfo') || {}

    setNoteText(note)
  }, [])

  useEffect(() => {
    const quoteInfo = B3LStorage.get('MyQuoteInfo') || {}

    B3LStorage.set('MyQuoteInfo', {
      ...quoteInfo,
      note: noteText,
    })
  }, [noteText])

  useEffect(() => {
    if (quoteNotes) setDefaultOpen(true)
  }, [quoteNotes])

  return (
    <Card>
      <CardContent
        sx={{
          p: '16px !important',
        }}
      >
        <B3CollapseContainer
          title={
            quoteStatus && quoteStatus === 'Draft'
              ? b3Lang('global.quoteNote.message')
              : b3Lang('global.quoteNote.notes')
          }
          defaultOpen={defaultOpen}
        >
          <Box
            sx={{
              padding: '16px 0',
            }}
          >
            {quoteStatus && quoteStatus === 'Draft' && (
              <Box
                sx={{
                  fontSize: '16px',
                  color: 'rgba(0, 0, 0, 0.38)',
                  mb: '16px',
                }}
              >
                {b3Lang('global.quoteNote.messageNote')}
              </Box>
            )}
            {quoteNotes ? (
              <Typography
                variant="body1"
                style={{
                  whiteSpace: 'pre-line',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                {quoteNotes}
              </Typography>
            ) : (
              <TextField
                multiline
                fullWidth
                rows={5}
                value={noteText}
                onChange={handleNoteTextChange}
                label={b3Lang('global.quoteNote.typeMessage')}
                size="small"
                variant="filled"
                sx={{
                  '& .MuiFormLabel-root': {
                    color: 'rgba(0, 0, 0, 0.38)',
                  },
                }}
              />
            )}
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
