import {
  Close,
} from '@mui/icons-material'

import {
  styled,
} from '@mui/material/styles'

import {
  TextField,
} from '@mui/material'

export const CloseButton = styled(Close)(() => ({
  cursor: 'pointer',
}))

export const CardContainer = styled('div')(() => ({
  padding: '20px 20px',
}))

export const StyledNumberTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}))
