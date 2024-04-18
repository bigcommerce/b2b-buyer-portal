import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Box, IconButton, Menu, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles'

import { B3Sping, showPageMask } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { useSort } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import { superAdminCompanies } from '@/shared/service/b2b'
import { useAppSelector } from '@/store'
import { OpenPageState } from '@/types/hooks'
import { endMasquerade, startMasquerade } from '@/utils'

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

export const defaultSortKey = 'companyName'

export const sortKeys = {
  companyName: 'companyName',
  companyAdminName: 'companyAdminName',
  companyEmail: 'companyEmail',
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
  const b3Lang = useB3Lang()

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMoreActionsClick = (event: MouseEvent<HTMLButtonElement>) => {
    handleSelect()
    setAnchorEl(event.currentTarget)
  }

  const menuItemText = isMasquerade
    ? b3Lang('dashboard.endMasqueradeAction')
    : b3Lang('dashboard.masqueradeAction')

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
    state: { B3UserId = 0 },
    dispatch,
  } = useContext(GlobaledContext)
  const customerId = useAppSelector(({ company }) => company.customer.id)

  const { setOpenPage } = props
  const b3Lang = useB3Lang()

  const salesRepCompanyId = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id
  )

  const [currentSalesRepCompanyId, setCurrentSalesRepCompanyId] =
    useState<number>(+salesRepCompanyId)

  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [filterData, setFilterData] = useState<ListItem>({
    q: '',
    orderBy: sortKeys[defaultSortKey],
  })

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortKeys,
    defaultSortKey,
    filterData,
    setFilterData,
    'asc'
  )

  const location = useLocation()

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
      await startMasquerade({
        customerId,
        companyId: id || currentSalesRepCompanyId,
        B3UserId: +B3UserId,
      })

      setOpenPage({
        isOpen: true,
        openUrl: '/dashboard',
      })

      setFilterData({
        ...filterData,
      })
    } finally {
      setIsRequestLoading(false)
    }
  }

  const endActing = async () => {
    try {
      showPageMask(dispatch, true)
      await endMasquerade({
        dispatch,
        salesRepCompanyId: +salesRepCompanyId,
        B3UserId: +B3UserId,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  const handleChange = async (q: string) => {
    setFilterData({
      ...filterData,
      q,
    })
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'companyName',
      title: b3Lang('dashboard.company'),
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
              {b3Lang('dashboard.selected')}
            </Box>
          )}
        </Box>
      ),
      isSortable: true,
    },
    {
      key: 'companyEmail',
      title: b3Lang('dashboard.email'),
      isSortable: true,
    },
    {
      key: 'companyName',
      title: b3Lang('dashboard.action'),
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
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
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
