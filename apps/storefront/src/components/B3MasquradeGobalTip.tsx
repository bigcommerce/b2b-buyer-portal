import {
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  Box,
} from '@mui/material'

import type {
  OpenPageState,
} from '@b3/hooks'

import Snackbar from '@mui/material/Snackbar'

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'

import GroupIcon from '@mui/icons-material/Group'
import {
  B3SStorage,
  // storeHash,
} from '@/utils'
import {
  superAdminEndMasquerade,
} from '@/shared/service/b2b'
import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

interface B3MasquradeGobalTipProps {
  isOpen: boolean,
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

const bottomHeightPage = ['shoppingList/', 'purchased-products']

export const B3MasquradeGobalTip = (props: B3MasquradeGobalTipProps) => {
  const {
    isOpen,
    setOpenPage,
  } = props
  const {
    state: {
      isAgenting,
      salesRepCompanyName,
      salesRepCompanyId,
      B3UserId,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const {
    hash,
  } = window.location

  const isAddBottom = bottomHeightPage.some((item: string) => hash.includes(item))

  const [isExpansion, setExpansion] = useState<boolean>(true)

  const [isMobile] = useMobile()

  const endActing = async () => {
    if (isOpen) {
      setOpenPage({
        isOpen: true,
        openUrl: '/?closeMasqurade=1',
      })
    } else {
      await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)
      B3SStorage.delete('isAgenting')
      B3SStorage.set('isB2BUser', false)
      B3SStorage.delete('salesRepCompanyId')
      B3SStorage.delete('salesRepCompanyName')
      dispatch(
        {
          type: 'common',
          payload: {
            salesRepCompanyId: '',
            salesRepCompanyName: '',
            isAgenting: false,
            isB2BUser: false,
          },
        },
      )
      setOpenPage({
        isOpen: true,
        openUrl: '/',
      })
    }
  }

  if (!isAgenting || (!isOpen && isMobile)) return <></>

  let sx = {}

  if (isMobile && isOpen) {
    sx = {
      width: '100%',
      bottom: 0,
      left: 0,
      borderRadius: '0px',
    }
  } else if (!isMobile && isAddBottom) {
    sx = {
      bottom: '90px !important',
    }
  }
  return (
    // {
    //   role === 4
    // }
    <Snackbar
      sx={{
        zIndex: '110000',
        backgroundColor: '#ED6C02',
        borderRadius: '4px',
        height: '52px',
        color: '#FFFFFF',
        ...sx,
      }}
      anchorOrigin={{
        vertical: 'bottom', horizontal: 'left',
      }}
      open
      key="123"
    >
      <Box
        sx={{
          padding: '5px 15px',
          width: '100%',
        }}
      >
        {
          !isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
              }}
            >
              <GroupIcon
                sx={{
                  mr: '12px',
                }}
              />
              {
              isExpansion && (
              <Box
                sx={{
                  fontWeight: 400,
                }}
              >
                You are masqueraded as
              </Box>
              )
              }
              <Box
                sx={{
                  fontWeight: '600',
                  m: '0 15px 0 10px',
                }}
              >
                {salesRepCompanyName}
              </Box>
              {
                isExpansion && (
                <Box
                  sx={{
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onClick={() => endActing()}
                >
                  END MASQURADE
                </Box>
                )
            }

              {
              isExpansion ? (
                <KeyboardArrowLeftIcon
                  onClick={() => setExpansion(false)}
                  sx={{
                    ml: '10px',
                  }}
                />
              )
                : (
                  <KeyboardArrowRightIcon
                    onClick={() => setExpansion(true)}
                    sx={{
                      ml: '10px',
                    }}
                  />
                )
            }

            </Box>
          )
        }

        {
          isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <GroupIcon
                  sx={{
                    mr: '12px',
                  }}
                />

                <Box
                  sx={{
                    fontWeight: '600',
                    m: '0 15px 0 10px',
                  }}
                >
                  Mitsubishi
                </Box>
              </Box>

              <Box
                sx={{
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                onClick={() => endActing()}
              >
                END MASQURADE
              </Box>

            </Box>
          )
        }

      </Box>

    </Snackbar>
  )
}
