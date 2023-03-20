import {
  Box,
  Typography,
} from '@mui/material'

const Loading = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#fef9f5',
      zIndex: 120000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Typography
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'black',
      }}
    >
      Loading...
    </Typography>
  </Box>
)

export default Loading
