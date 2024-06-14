import { ChangeEvent, useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Card, CardContent, TextField, Typography } from '@mui/material';

import { B3CollapseContainer } from '@/components';
import {
  isB2BUserSelector,
  rolePermissionSelector,
  setDraftQuoteInfoNote,
  store,
  useAppSelector,
} from '@/store';

interface QuoteNoteProps {
  quoteStatus?: string | number;
  quoteNotes?: string;
}

export default function QuoteNote(props: QuoteNoteProps) {
  const b3Lang = useB3Lang();
  const { quoteStatus, quoteNotes = '' } = props;

  const [noteText, setNoteText] = useState('');
  const [defaultOpen, setDefaultOpen] = useState(false);

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const b2bPermissions = useAppSelector(rolePermissionSelector);

  const quotesActionsPermission = isB2BUser ? b2bPermissions.quotesActionsPermission : true;

  const handleNoteTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNoteText(event?.target.value || '');
    store.dispatch(setDraftQuoteInfoNote(event?.target.value || ''));
  };

  useEffect(() => {
    const note = store.getState().quoteInfo.draftQuoteInfo.note || '';

    setNoteText(note);
  }, []);

  useEffect(() => {
    store.dispatch(setDraftQuoteInfoNote(noteText || ''));
  }, [noteText]);

  useEffect(() => {
    if (quoteNotes) setDefaultOpen(true);
  }, [quoteNotes]);

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
              <Box>
                {quotesActionsPermission ? (
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
                ) : null}
              </Box>
            )}
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}
