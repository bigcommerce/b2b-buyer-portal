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
  useContext,
} from 'react'

import {
  B3CollapseContainer,
} from '@/components'

import {
  B3LStorage,
} from '@/utils'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

export const QuoteNote = () => {
  const {
    state: {
      portalStyle: {
        primaryColor = '',
      },
    },
  } = useContext(CustomStyleContext)

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
        <B3CollapseContainer title="Message">
          <Box sx={{
            padding: '16px 0',
          }}
          >
            <Box
              sx={{
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.38)',
                mb: '16px',
              }}
            >
              Your message will be sent after submitting a quote
            </Box>
            <TextField
              multiline
              fullWidth
              rows={5}
              value={noteText}
              onChange={handleNoteTextChange}
              label="Type a message..."
              size="small"
              variant="filled"
              sx={{
                '& .MuiFormLabel-root': {
                  color: 'rgba(0, 0, 0, 0.38)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: primaryColor,
                },
                '& .MuiFilledInput-root:after': {
                  borderBottom: `2px solid ${primaryColor || '#1976d2'}`,
                },
              }}
            />
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
