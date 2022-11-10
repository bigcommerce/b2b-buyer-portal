import {
  useContext,
} from 'react'
import {
  styled,
} from '@mui/material/styles'

import {
  Box,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

// interface LogoProps {
//   logoUrl: string,
//   isMobile: boolean,
// }

// const Logo = styled('div')((props: LogoProps) => ({
//   width: '100%',
//   height: '100%',
//   backgroundImage: `url(${props?.logoUrl || ''})`,
//   backgroundSize: '100% 100%',
//   backgroundRepeat: 'no-repeat',
//   backgroundPosition: 'center',
// }))

export const B3Logo = () => {
  const {
    state: {
      logo,
    },
  } = useContext(GlobaledContext)

  const [isMobile] = useMobile()

  return (
    <Box
      sx={{
        flexShrink: '0',
        height: `${isMobile ? '15vw' : '70px'}`,
        width: `${isMobile ? '45%' : '100%'}`,
        '& img': {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        },
      }}
    >
      <img
        src={logo}
        alt="logo"
      />
    </Box>

  )
}
