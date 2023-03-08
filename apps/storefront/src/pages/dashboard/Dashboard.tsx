import {
  useEffect,
  useContext,
  useState,
  MouseEvent,
} from 'react'

import {
  Box,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material'
import {
  styled,
} from '@mui/material/styles'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import {
  useLocation,
} from 'react-router-dom'
import {
  getAgentInfo,
  superAdminCompanies,
  superAdminBeginMasquerade,
  superAdminEndMasquerade,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import B3FilterSearch from '../../components/filter/B3FilterSearch'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  B3SStorage,
  showPageMask,
  // storeHash,
} from '@/utils'

import DashboardCard from './components/DashboardCard'

interface ListItem {
  [key: string]: string
}

const StyledMenu = styled(Menu)(() => ({
  '& .MuiPaper-elevation': {
    boxShadow: '0px 1px 0px -1px rgba(0, 0, 0, 0.1), 0px 1px 6px rgba(0, 0, 0, 0.07), 0px 1px 4px rgba(0, 0, 0, 0.06)',
  },
}))

const Dashboard = () => {
  const {
    state: {
      customerId,
      B3UserId,
      salesRepCompanyId = 0,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const [currentSalesRepCompanyId, setCurrentSalesRepCompanyId] = useState<number>(+salesRepCompanyId)

  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [filterData, setFilterData] = useState<ListItem>({
    q: '',
  })

  const location = useLocation()

  const setMasqueradeInfo = async () => {
    try {
      setIsRequestLoading(true)
      const data: any = await getAgentInfo(customerId)
      if (data?.superAdminMasquerading) {
        const {
          id,
          companyName,
        } = data.superAdminMasquerading
        B3SStorage.set('isAgenting', true)
        B3SStorage.set('salesRepCompanyId', id)
        B3SStorage.set('salesRepCompanyName', companyName)
        // B3SStorage.set('isB2BUser', true)

        dispatch(
          {
            type: 'common',
            payload: {
              salesRepCompanyId: id,
              salesRepCompanyName: companyName,
              isAgenting: true,
              isB2BUser: true,
            },
          },
        )
      }
    } finally {
      setIsRequestLoading(false)
    }
    // }
  }

  const getSuperAdminCompaniesList = async (params: ListItem) => {
    const {
      superAdminCompanies: {
        edges = [],
        totalCount,
      },
    }: any = await superAdminCompanies(+B3UserId, params)

    return {
      edges,
      totalCount,
    }
  }

  const handleMoreActionsClick = (event: MouseEvent<HTMLButtonElement>, companyId: number) => {
    setCurrentSalesRepCompanyId(companyId)
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const startActing = async (id?: number) => {
    try {
      setIsRequestLoading(true)
      setAnchorEl(null)
      await superAdminBeginMasquerade(id || currentSalesRepCompanyId, +B3UserId)
      await setMasqueradeInfo()
      setFilterData({
        ...filterData,
      })
    } catch (error) {
      setIsRequestLoading(false)
    }
  }

  const endActing = async () => {
    try {
      showPageMask(true)
      await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)
      B3SStorage.delete('isAgenting')
      B3SStorage.delete('salesRepCompanyId')
      B3SStorage.delete('salesRepCompanyName')
      dispatch(
        {
          type: 'common',
          payload: {
            salesRepCompanyId: '',
            salesRepCompanyName: '',
            isAgenting: false,
          },
        },
      )
      setFilterData({
        ...filterData,
      })
    } finally {
      showPageMask(false)
    }
  }

  useEffect(() => {
    if (location.state) {
      endActing()
      location.state = null
    }
  }, [location])

  const handleChange = async (q: string) => {
    setFilterData({
      q,
    })
  }

  const open = Boolean(anchorEl)

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'companyName',
      title: 'Company',
      render: (row: CustomFieldItems) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {row.companyName}
          {
            row.companyId === +salesRepCompanyId && (
            <Box
              sx={{
                fontWeight: 400,
                fontSize: '13px',
                background: '#ED6C02',
                ml: '5px',
                p: '2px 7px',
                color: '#FFFFFF',
                borderRadius: '10px',
              }}
            >
              Selected
            </Box>
            )
          }
        </Box>
      ),
    },
    {
      key: 'companyAdminName',
      title: 'Admin',
    },
    {
      key: 'companyEmail',
      title: 'Email',
    },
    {
      key: 'companyName',
      title: 'Action',
      render: (row: CustomFieldItems) => {
        const {
          companyId,
        } = row
        return (
          <>
            <IconButton
              onClick={(e) => handleMoreActionsClick(e, companyId)}
            >
              <MoreHorizIcon />
            </IconButton>
            <StyledMenu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem
                sx={{
                  color: '#1976D2',
                }}
                onClick={() => startActing()}
              >
                Masquerade
              </MenuItem>
            </StyledMenu>
          </>
        )
      },
    },
  ]

  return (
    <B3Sping
      isSpinning={isRequestLoading}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >

        <Box
          sx={{
            mb: '24px',
          }}
        >
          <B3FilterSearch
            handleChange={handleChange}
          />
        </Box>
        <B3PaginationTable
          columnItems={columnItems}
          rowsPerPageOptions={[10, 20, 30]}
          getRequestList={getSuperAdminCompaniesList}
          searchParams={filterData || {}}
          isCustomRender={false}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          renderItem={(row: ListItem) => (
            <DashboardCard
              row={row}
              startActing={startActing}
              endActing={endActing}
              salesRepCompanyId={+salesRepCompanyId}
            />
          )}
        />
      </Box>
    </B3Sping>
  )
}

export default Dashboard
