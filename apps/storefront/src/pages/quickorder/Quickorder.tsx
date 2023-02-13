import {
  useState,
  useRef,
  useEffect,
} from 'react'

import {
  Box,
  Grid,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import QuickorderTable from './components/QuickorderTable'

interface TableRefProps extends HTMLInputElement {
  getCheckedList: () => CustomFieldItems,
}

const Quickorder = () => {
  useEffect(() => {
  }, [])

  const [isMobile] = useMobile()

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const tableRef = useRef<TableRefProps>(null)

  const getCheckedList = () => {
    const checkedValue = tableRef.current?.getCheckedList()

    console.log(checkedValue)
  }

  return (
    <B3Sping
      isSpinning={isRequestLoading}
    >
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Grid
            container
            spacing={2}
          >

            <Grid xs={isMobile ? 12 : 8}>
              <QuickorderTable
                setIsRequestLoading={setIsRequestLoading}
                ref={tableRef}
              />
            </Grid>

            <Grid xs={isMobile ? 12 : 4}>
              sidebar
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
          }}
          onClick={getCheckedList}
        >
          button
        </Box>
      </Box>
    </B3Sping>
  )
}

export default Quickorder
