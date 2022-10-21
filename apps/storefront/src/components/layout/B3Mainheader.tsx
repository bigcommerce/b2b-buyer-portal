import {
  useState,
  useEffect,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  useLocation,
} from 'react-router-dom'

import {
  routes,
} from '@/shared/routes'

import {
  RouteItem,
} from '@/shared/routes/routes'

import {
  B3AccountInfo,
} from './B3AccountInfo'

export const B3Mainheader = () => {
  const location = useLocation()

  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    const itemsRoutes = routes.filter((item: RouteItem) => item.path === location.pathname)
    setTitle(itemsRoutes[0].name)
  }, [location])

  return (
    <Box
      sx={{
        p: '0 24px 0 80px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '70px',
          alignItems: 'center',
        }}
      >
        <Box
          component="h4"
        >
          Renteach building
        </Box>
        <B3AccountInfo />
      </Box>
      <Box
        component="h3"
        sx={{
          height: '80px',
          m: '0',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'end',
        }}
      >
        {title}
      </Box>
    </Box>

  )
}
