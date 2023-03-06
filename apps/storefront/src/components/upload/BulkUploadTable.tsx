import {
  useState,
  MouseEvent,
} from 'react'

import {
  Box,
  Button,
  Typography,
  MenuItem,
  Menu,
  Tabs,
  Tab,
  Link,
} from '@mui/material'
import {
  InsertDriveFile,
  MoreHoriz,
} from '@mui/icons-material'

import {
  styled,
} from '@mui/material/styles'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import {
  useMobile,
} from '@/hooks'

import BulkUploadTableCard from './BulkUploadTableCard'

interface BulkUploadTableProps {
  setStep: (step: string) => void,
  fileDatas: CustomFieldItems | null,
  fileName: string,
}

interface ListItem {
  [key: string]: string
}

const StyledTableContainer = styled(Box)(() => {
  const [isMobile] = useMobile()
  const style = {
    boxShadow: 'none',
  }

  const mobileStyle = {
    boxShadow: '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
    borderRadius: '4px',
    padding: '16px',
    marginTop: '1rem',
  }
  return ({
    '& .CSVProducts-info': isMobile ? mobileStyle : style,
  })
})

const BulkUploadTable = (props: BulkUploadTableProps) => {
  const {
    setStep,
    fileDatas,
    fileName,
  } = props
  const [isMobile] = useMobile()

  const columnErrorsItems: TableColumnItem <ListItem>[] = [
    {
      key: 'sku',
      title: 'SKU',
      width: '25%',
      render: (row) => <Typography>{row.sku}</Typography>,
    },
    {
      key: 'qty',
      title: 'Qty',
      width: '20%',
      render: (row) => <Typography>{row.qty}</Typography>,
    },
    {
      key: 'row',
      title: 'Row',
      width: '20%',
      render: (row) => <Typography>{row.row}</Typography>,
    },
    {
      key: 'error',
      title: 'Error',
      width: '35%',
      render: (row) => <Typography>{row.error}</Typography>,
    },
  ]

  const columnValidItems: TableColumnItem <ListItem>[] = [
    {
      key: 'sku',
      title: 'SKU',
      width: '50%',
      render: (row) => <Typography>{row.sku}</Typography>,
    },
    {
      key: 'qty',
      title: 'Qty',
      width: '50%',
      render: (row) => <Typography>{row.qty}</Typography>,
    },
  ]

  const errorProduct = fileDatas?.errorProduct || []
  const validProduct = fileDatas?.validProduct || []
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [open, setOpen] = useState<boolean>(Boolean(anchorEl))
  const [activeTab, setActiveTab] = useState<string>(errorProduct.length > 0 ? 'error' : 'valid')

  const handleOpenBtnList = (e: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget)
    setOpen(true)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setOpen(false)
  }

  const handleRemoveCsv = () => {
    handleClose()
    setStep('init')
  }

  const handleChangeTab = (e: CustomFieldItems, selectedTabValue: any) => {
    setActiveTab(selectedTabValue)
  }

  const getProductInfo = (params: CustomFieldItems) => {
    if (activeTab === 'error') {
      return {
        edges: errorProduct,
        totalCount: errorProduct.length || 0,
      }
    }

    if (activeTab === 'valid') {
      const {
        first,
        offset,
      } = params

      const start = offset
      const limit = first + start
      const currentPageProduct = validProduct.slice(start, limit)

      return {
        edges: currentPageProduct,
        totalCount: validProduct.length || 0,
      }
    }

    return {
      edges: [],
      totalCount: 0,
    }
  }

  return (
    <Box
      sx={{
        paddingBottom: '1rem',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          border: '1px solid #D2D2D3',
          borderRadius: '4px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
          }}
        >
          <InsertDriveFile color="action" />
          <Typography
            sx={{
              marginLeft: '1rem',
            }}
          >
            {fileName}
          </Typography>
        </Box>

        <Button
          sx={{
            color: 'rgba(0, 0, 0, 0.54)',
          }}
          onClick={(e) => {
            handleOpenBtnList(e)
          }}
        >
          <MoreHoriz />
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              handleRemoveCsv()
            }}
            sx={{
              color: '#D32F2F',
            }}
          >
            Remove
          </MenuItem>

        </Menu>
      </Box>
      <Box
        sx={{
          marginTop: '20px',
          boxShadow: isMobile ? 'none' : '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
          borderRadius: '4px',
        }}
      >
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleChangeTab}
            aria-label="basic tabs example"
          >
            {
              errorProduct.length > 0 && (
                <Tab
                  value="error"
                  label={errorProduct.length ? `Errors (${errorProduct.length})` : 'Errors'}
                />
              )
            }
            {
              validProduct.length > 0 && (
              <Tab
                value="valid"
                label={validProduct.length ? `Valid (${validProduct.length})` : 'Valid'}
              />
              )
            }
          </Tabs>
        </Box>

        <StyledTableContainer>
          <B3PaginationTable
            columnItems={activeTab === 'error' ? columnErrorsItems : columnValidItems}
            rowsPerPageOptions={[10, 20, 50]}
            showRowsPerPageOptions={false}
            showBorder={!isMobile}
            getRequestList={getProductInfo}
            labelRowsPerPage=""
            itemIsMobileSpacing={0}
            noDataText="No product"
            searchParams={{
              activeTab,
            }}
            showPagination={activeTab === 'valid'}
            renderItem={(row: CustomFieldItems) => (
              <BulkUploadTableCard
                products={row}
                activeTab={activeTab}
              />
            )}
          />
        </StyledTableContainer>

        {
          activeTab === 'error' && (
            <Box
              sx={{
                padding: isMobile ? '18px 0' : '18px 16px',
              }}
            >
              <Link href={fileDatas?.errorFile}>Download errors</Link>
            </Box>
          )
        }
      </Box>
    </Box>
  )
}

export default BulkUploadTable
