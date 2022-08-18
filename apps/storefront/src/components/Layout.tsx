import {
  Box,
} from '@mui/material'

export function Layout({
  children,
}: {
  children: any;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
