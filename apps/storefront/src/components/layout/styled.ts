import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'

const NavMessage = styled(Box)(() => ({
  borderRadius: '50%',
  display: 'flex',
  height: '25px',
  width: '25px',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#3385d6',
  color: 'white',
}))

export default NavMessage
