import {
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  OrderB2B,
} from './OrderB2B'

import {
  OrderBC,
} from './OrderBC'

import {
  GlobaledContext,
} from '@/shared/global'

export default function Order() {
  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  return (
    <Box>
      {
        isB2BUser ? <OrderB2B /> : <OrderBC />
      }
    </Box>
  )
}
