import {
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'

import {
  Box,
} from '@mui/material'

import QuickorderTable from './components/QuickorderTable'

const Quickorder = () => {
  useEffect(() => {
  }, [])

  const tableRef = useRef<any>(null)

  return (
    <Box>
      <Box sx={{
        width: '65%',
      }}
      >
        <QuickorderTable
          isEdit
          ref={tableRef}
        />
      </Box>
    </Box>
  )
}

export default Quickorder
