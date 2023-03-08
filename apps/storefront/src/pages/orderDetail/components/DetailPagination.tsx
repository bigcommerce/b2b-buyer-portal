import {
  Box, Typography,
} from '@mui/material'

import NavigateNextIcon from '@mui/icons-material/NavigateNext'

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'

import IconButton from '@mui/material/IconButton'

import {
  useLocation,
} from 'react-router-dom'

import {
  useEffect,
  useState,
  useContext,
} from 'react'
import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getB2BAllOrders,
  getBCAllOrders,
} from '@/shared/service/b2b'

interface searchParamsProps {
  [key: string]: number | string | undefined
  offset: number
  first: number
}
interface DetailPageProps {
  onChange: (id: number | string) => void
}

interface LocationState {
  beginDateAt?: string | null
  endDateAt?: string | null
  currentIndex?: number
  totalCount?: number
  searchParams?: searchParamsProps
}

interface rightLeftSideProps {
  rightId: number | string
  leftId: number | string
}

const initListIndex = 100000000

const DetailPagination = ({
  onChange,
}: DetailPageProps) => {
  const [listIndex, setListIndex] = useState<number>(initListIndex)
  const [arrived, setArrived] = useState<string>('')

  const [rightLeftSide, setRightLeftSide] = useState<rightLeftSideProps>({
    rightId: '',
    leftId: '',
  })

  const localtion = useLocation()

  const [isMobile] = useMobile()

  let currentIndex = 0
  let totalCount = 0
  let beginDateAt: string | null = null
  let endDateAt: string | null = null
  let searchParams = {
    offset: 0,
  }

  if (localtion?.state) {
    const state = localtion.state as LocationState
    currentIndex = state?.currentIndex || 0
    totalCount = state?.totalCount || 0
    beginDateAt = state?.beginDateAt || null
    endDateAt = state?.endDateAt || null
    searchParams = state?.searchParams || {
      offset: 0,
    }
  }

  if (JSON.stringify(searchParams) === '{}') return null

  const [loading, setLoading] = useState<boolean>(false)

  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const fetchList = async () => {
    setLoading(true)

    const index = () => {
      if (listIndex) return listIndex - 1
      return 0
    }

    const searchDetailParams = {
      ...searchParams,
      first: 3,
      offset: index(),
      beginDateAt: beginDateAt || null,
      endDateAt: endDateAt || null,
      orderBy: '-createdAt',
    }

    const fn = isB2BUser ? getB2BAllOrders : getBCAllOrders

    const orders = isB2BUser ? 'allOrders' : 'customerOrders'

    const {
      [orders]: {
        edges: list,
        totalCount,
      },
    }: CustomFieldItems = await fn(searchDetailParams)

    let flag = ''

    let rightId = ''

    let leftId = ''

    if (listIndex === totalCount - 1) {
      flag = 'toRight'
      leftId = list[list.length - 2]?.node.orderId || 0
    } else if (listIndex === 0) {
      flag = 'toLeft'
      rightId = list[1]?.node.orderId || 0
    } else {
      leftId = list[0]?.node.orderId || 0
      rightId = list[2]?.node.orderId || 0
    }

    setRightLeftSide({
      leftId,
      rightId,
    })

    setArrived(flag)

    setLoading(false)
  }

  useEffect(() => {
    if (totalCount > 0) setListIndex(currentIndex)
    if (listIndex === initListIndex) return
    const searchPageStart = currentIndex + searchParams.offset
    setListIndex(searchPageStart)
  }, [searchParams])

  useEffect(() => {
    if (listIndex === initListIndex) return
    fetchList()
  }, [listIndex])

  const handleBeforePage = () => {
    setListIndex(listIndex - 1)
    onChange(rightLeftSide.leftId)
  }

  const handleNextPage = () => {
    setListIndex(listIndex + 1)
    onChange(rightLeftSide.rightId)
  }

  const index = listIndex + 1

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      {
        !isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Order
          <Typography
            sx={{
              m: 1,
            }}
          >
            {index}
          </Typography>
          of
          <Box
            sx={{
              ml: 1,
            }}
          >
            {totalCount}
          </Box>
        </Box>
        )
      }

      <IconButton
        onClick={handleBeforePage}
        disabled={totalCount <= 1 || arrived === 'toLeft' || loading}
      >
        <NavigateBeforeIcon />
      </IconButton>
      <IconButton
        onClick={handleNextPage}
        disabled={totalCount <= 1 || arrived === 'toRight' || loading}
      >
        <NavigateNextIcon />
      </IconButton>

    </Box>
  )
}

export {
  DetailPagination,
}
