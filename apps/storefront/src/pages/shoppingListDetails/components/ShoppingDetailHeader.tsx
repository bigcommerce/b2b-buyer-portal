import {
  Box,
  Grid,
  styled,
  Typography,
  Button,
} from '@mui/material'

import {
  ArrowBackIosNew,
} from '@mui/icons-material'

import {
  ShoppingStatus,
} from '../../shoppingLists/ShoppingStatus'

import {
  useMobile,
} from '@/hooks'

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '0.5rem',
}))

interface ShoppingDetailHeaderProps {
  shoppingListInfo: any,
  role: string | number,
  customerInfo: any,
  goToShoppingLists: () => void,
  handleUpdateShoppingList: (status: number) => void,
  isB2BUser: boolean,
}

const ShoppingDetailHeader = (props: ShoppingDetailHeaderProps) => {
  const [isMobile] = useMobile()

  const {
    shoppingListInfo,
    role,
    customerInfo,
    handleUpdateShoppingList,
    goToShoppingLists,
    isB2BUser,
  } = props

  const isDisabledBtn = shoppingListInfo?.products?.edges.length === 0

  const currentSLCreateRole = shoppingListInfo?.customerInfo?.role

  const gridOptions = (xs: number) => (isMobile ? {} : {
    xs,
  })
  return (
    <>
      <Box
        sx={{
          marginBottom: '16px',
          width: 'fit-content',
        }}
      >
        <Box
          sx={{
            color: '#1976d2',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={goToShoppingLists}
        >
          <ArrowBackIosNew
            fontSize="small"
            sx={{
              fontSize: '12px',
              marginRight: '0.5rem',
            }}
          />
          <p style={{
            margin: 0,
          }}
          >
            Back to shopping lists
          </p>
        </Box>
      </Box>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: `${isMobile ? 'column' : 'row'}`,
          mb: `${isMobile ? '16px' : ''}`,
        }}
      >
        <Grid
          item
          {...gridOptions(8)}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: `${isMobile ? 'start' : 'center'}`,
              flexDirection: `${isMobile ? 'column' : 'row'}`,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                marginRight: '1rem',
                wordBreak: 'break-all',
                color: '#263238',
              }}
            >
              {`${shoppingListInfo?.name || ''}`}
            </Typography>
            {
              isB2BUser && +currentSLCreateRole === 2 && (
                <Typography
                  sx={{
                    m: `${isMobile ? '10px 0' : '0'}`,
                  }}
                >
                  {
                    shoppingListInfo && (
                      <ShoppingStatus status={shoppingListInfo?.status} />
                    )
                  }
                </Typography>
              )
            }
          </Box>
          <Box>
            <Typography
              sx={{
                width: '100%',
                wordBreak: 'break-all',
              }}
            >
              {shoppingListInfo?.description}
            </Typography>
            {
              isB2BUser && (
                <StyledCreateName>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      marginRight: '0.5rem',
                    }}
                  >
                    Created by:
                  </Typography>
                  <span>{`${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`}</span>
                </StyledCreateName>
              )
            }
          </Box>
        </Grid>

        <Grid
          item
          sx={{
            textAlign: `${isMobile ? 'none' : 'end'}`,
          }}
          {...gridOptions(4)}
        >
          {
            (role === 2 && shoppingListInfo?.status === 30) && (
              <Button
                variant="outlined"
                disabled={isDisabledBtn}
                onClick={() => {
                  handleUpdateShoppingList(40)
                }}
              >
                Submit for Approval
              </Button>
            )
          }
          {
              ((role === 0 || role === 1) && shoppingListInfo?.status === 40) && (
                <Box>
                  <Button
                    variant="outlined"
                    sx={{
                      marginRight: '1rem',
                    }}
                    onClick={() => {
                      handleUpdateShoppingList(20)
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      handleUpdateShoppingList(0)
                    }}
                  >
                    Approve
                  </Button>
                </Box>
              )
            }
        </Grid>
      </Grid>
    </>
  )
}

export default ShoppingDetailHeader
