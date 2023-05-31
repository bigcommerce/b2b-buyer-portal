import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Box, IconButton, Menu, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles'

import { B3Sping, showPageMask } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { GlobaledContext } from '@/shared/global'
import {
  getAgentInfo,
  superAdminBeginMasquerade,
  superAdminCompanies,
  superAdminEndMasquerade,
} from '@/shared/service/b2b'
import { B3SStorage } from '@/utils'

import B3FilterSearch from '../../components/filter/B3FilterSearch'

import DashboardCard from './components/DashboardCard'

interface ListItem {
  [key: string]: string
}

interface B3MeanProps {
  isMasquerade: boolean
  handleSelect: () => void
  startActing: () => void
  endActing: () => void
}

interface DashboardProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

const StyledMenu = styled(Menu)(() => ({
  '& .MuiPaper-elevation': {
    boxShadow:
      '0px 1px 0px -1px rgba(0, 0, 0, 0.1), 0px 1px 6px rgba(0, 0, 0, 0.07), 0px 1px 4px rgba(0, 0, 0, 0.06)',
    borderRadius: '4px',
  },
}))

function B3Mean({
  isMasquerade,
  handleSelect,
  startActing,
  endActing,
}: B3MeanProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMoreActionsClick = (event: MouseEvent<HTMLButtonElement>) => {
    handleSelect()
    setAnchorEl(event.currentTarget)
  }

  const menuItemText = isMasquerade ? 'End Masquerade' : 'Masquerade'

  return (
    <>
      <IconButton onClick={(e) => handleMoreActionsClick(e)}>
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
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          sx={{
            color: 'primary.main',
          }}
          onClick={() => {
            if (isMasquerade) {
              endActing()
            } else {
              setAnchorEl(null)
              startActing()
            }
          }}
        >
          {menuItemText}
        </MenuItem>
      </StyledMenu>
    </>
  )
}

function Dashboard(props: DashboardProps) {
  const {
    state: { customerId, B3UserId, salesRepCompanyId = 0 },
    dispatch,
  } = useContext(GlobaledContext)

  const { setOpenPage } = props

  const [currentSalesRepCompanyId, setCurrentSalesRepCompanyId] =
    useState<number>(+salesRepCompanyId)

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
        const { id, companyName } = data.superAdminMasquerading
        B3SStorage.set('isAgenting', true)
        B3SStorage.set('salesRepCompanyId', id)
        B3SStorage.set('salesRepCompanyName', companyName)
        // B3SStorage.set('isB2BUser', true)

        dispatch({
          type: 'common',
          payload: {
            salesRepCompanyId: id,
            salesRepCompanyName: companyName,
            isAgenting: true,
            isB2BUser: true,
          },
        })
      }
    } finally {
      setIsRequestLoading(false)
    }
  }

  const getSuperAdminCompaniesList = async (params: ListItem) => {
    const {
      superAdminCompanies: { edges = [], totalCount },
    }: any = await superAdminCompanies(+B3UserId, params)

    return {
      edges,
      totalCount,
    }
  }

  const startActing = async (id?: number) => {
    try {
      setIsRequestLoading(true)
      await superAdminBeginMasquerade(id || currentSalesRepCompanyId, +B3UserId)
      await setMasqueradeInfo()

      setOpenPage({
        isOpen: true,
        openUrl: '/dashboard',
      })

      setFilterData({
        ...filterData,
      })
    } catch (error) {
      setIsRequestLoading(false)
    }
  }

  const endActing = async () => {
    try {
      showPageMask(dispatch, true)
      await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)
      location.state = null
      B3SStorage.delete('isAgenting')
      B3SStorage.delete('salesRepCompanyId')
      B3SStorage.delete('salesRepCompanyName')
      dispatch({
        type: 'common',
        payload: {
          salesRepCompanyId: '',
          salesRepCompanyName: '',
          isAgenting: false,
        },
      })
      setFilterData({
        ...filterData,
      })
    } finally {
      showPageMask(dispatch, false)
    }
  }

  useEffect(() => {
    const params = {
      ...location,
    }
    if (params?.state) {
      endActing()
    }
  }, [location])

  const handleChange = async (q: string) => {
    setFilterData({
      q,
    })
  }

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
          {row.companyId === +salesRepCompanyId && (
            <Box
              sx={{
                fontWeight: 400,
                fontSize: '13px',
                background: '#ED6C02',
                ml: '16px',
                p: '2px 7px',
                color: '#FFFFFF',
                borderRadius: '10px',
              }}
            >
              Selected
            </Box>
          )}
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
        const { companyId } = row
        const isMasquerade = +companyId === +salesRepCompanyId

        return (
          <B3Mean
            isMasquerade={isMasquerade}
            handleSelect={() => {
              setCurrentSalesRepCompanyId(companyId)
            }}
            startActing={startActing}
            endActing={endActing}
          />
        )
      },
    },
  ]

  return (
    <B3Sping isSpinning={isRequestLoading}>
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
          <B3FilterSearch handleChange={handleChange} />
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
