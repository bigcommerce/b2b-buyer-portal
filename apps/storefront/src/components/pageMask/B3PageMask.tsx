import {
  useContext,
} from 'react'

import {
  Box,
  Typography,
} from '@mui/material'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  DispatchProps,
} from '@/shared/global/context/config'

export const B3PageMask = () => {
  const {
    state: {
      showPageMask,
    },
  } = useContext(GlobaledContext)

  return (
    <>
      {
        showPageMask && (
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
      }
    </>
  )
}

export const showPageMask = (dispatch: DispatchProps, isShow: boolean) => {
  dispatch({
    type: 'common',
    payload: {
      showPageMask: isShow,
    },
  })
}
