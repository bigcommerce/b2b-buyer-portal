import {
  useState,
  useContext,
  useEffect,
} from 'react'

import {
  Box,
  Grid,
} from '@mui/material'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  useMobile,
} from '@/hooks'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import QuickorderTable from './components/QuickorderTable'
import QuickOrderFooter from './components/QuickOrderFooter'
import {
  QuickOrderPad,
} from './components/QuickOrderPad'

const Quickorder = () => {
  useEffect(() => {
  }, [])
  const {
    state: {
      role,
    },
  } = useContext(GlobaledContext)

  const [isMobile] = useMobile()

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)
  const [checkedArr, setCheckedArr] = useState<CustomFieldItems>([])

  return (
    <B3Sping
      isSpinning={isRequestLoading}
    >
      <Box
        sx={{
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Grid
            sx={{
              m: 0,
              width: '100%',
            }}
            container
            spacing={2}
          >

            <Grid
              item
              xs={isMobile ? 12 : 8}
              sx={{
                backgroundColor: '#ffffff',
              }}
            >
              <QuickorderTable
                setCheckedArr={setCheckedArr}
                setIsRequestLoading={setIsRequestLoading}
              />
            </Grid>

            <Grid
              item
              xs={isMobile ? 12 : 4}
              sx={{
                pt: !isMobile ? '0px !important' : '16px',
                pl: isMobile ? '0px !important' : '16px',
              }}
            >
              {
                role !== 2 && (
                  <QuickOrderPad />
                )
              }
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
        >
          <QuickOrderFooter
            role={role}
            checkedArr={checkedArr}
            setIsRequestLoading={setIsRequestLoading}
          />
        </Box>
      </Box>
    </B3Sping>
  )
}

export default Quickorder
