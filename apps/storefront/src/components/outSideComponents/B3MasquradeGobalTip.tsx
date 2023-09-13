import { Dispatch, SetStateAction, useContext, useState } from 'react'
import type { OpenPageState } from '@b3/hooks'
import GroupIcon from '@mui/icons-material/Group'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Button, SnackbarOrigin, SxProps } from '@mui/material'
import Snackbar from '@mui/material/Snackbar'

import useMobile from '@/hooks/useMobile'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { superAdminEndMasquerade } from '@/shared/service/b2b'
import { B3SStorage } from '@/utils'

import {
  getContrastColor,
  getLocation,
  getPosition,
  getStyles,
  setMUIMediaStyle,
  splitCustomCssValue,
} from './utils/b3CustomStyles'

interface B3MasquradeGobalTipProps {
  isOpen: boolean
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

const bottomHeightPage = ['shoppingList/', 'purchased-products']

export default function B3MasquradeGobalTip(props: B3MasquradeGobalTipProps) {
  const { isOpen, setOpenPage } = props
  const {
    state: {
      isAgenting,
      salesRepCompanyName,
      salesRepCompanyId,
      B3UserId,
      customerId,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const { hash, href } = window.location

  const {
    state: { masqueradeButton },
  } = useContext(CustomStyleContext)

  const isAddBottom = bottomHeightPage.some((item: string) =>
    hash.includes(item)
  )

  const initExpansion = () => {
    const isMasqueradeTipExpansion = B3SStorage.get('isMasqueradeTipExpansion')

    if (typeof isMasqueradeTipExpansion === 'boolean') {
      return isMasqueradeTipExpansion
    }

    return true
  }

  const [isExpansion, setExpansion] = useState<boolean>(initExpansion())

  const [isMobile] = useMobile()

  const endActing = async () => {
    if (isOpen) {
      setOpenPage({
        isOpen: true,
        openUrl: '/dashboard?closeMasqurade=1',
      })
    } else {
      await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)
      B3SStorage.delete('isAgenting')
      B3SStorage.delete('salesRepCompanyId')
      B3SStorage.delete('salesRepCompanyName')
      B3SStorage.delete('salesRepCustomerGroupId')
      dispatch({
        type: 'common',
        payload: {
          salesRepCompanyId: '',
          salesRepCompanyName: '',
          salesRepCustomerGroupId: '',
          isAgenting: false,
        },
      })
      setOpenPage({
        isOpen: true,
        openUrl: '/dashboard',
      })
    }
  }

  const isMasqueradeTipExpansion = (isExpansion: boolean) => {
    setExpansion(isExpansion)
    B3SStorage.set('isMasqueradeTipExpansion', isExpansion)
  }

  if (href.includes('/checkout') || !customerId) return null

  if (!isAgenting) return null

  const {
    text = '',
    color = '',
    customCss = '',
    location = 'bottomLeft',
    horizontalPadding = '',
    verticalPadding = '',
  } = masqueradeButton

  const defaultLocation: SnackbarOrigin = {
    vertical: 'bottom',
    horizontal: 'left',
  }

  let sx: SxProps = {}

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

  const cssInfo = splitCustomCssValue(customCss)
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string
    mediaBlocks: string[]
  } = cssInfo
  const MUIMediaStyle = setMUIMediaStyle(mediaBlocks)

  const customStyles: SxProps = {
    backgroundColor: `${color || '#ED6C02'}`,
    color: getContrastColor(color || '#FFFFFF'),
    padding: '0',
    ...getStyles(cssValue),
  }

  const isMobileCustomStyles: SxProps = {
    backgroundColor: `${color || '#ED6C02'}`,
    color: getContrastColor(color || '#FFFFFF'),
  }

  const customBuyerPortalPagesStyles: SxProps = {
    bottom: '24px',
    left: '24px',
    right: 'auto',
    top: 'unset',
  }

  return (
    <>
      {!isOpen && isMobile && (
        <Snackbar
          sx={{
            zIndex: '99999999993',
            ...getPosition(horizontalPadding, verticalPadding, location),
          }}
          anchorOrigin={getLocation(location) || defaultLocation}
          open
        >
          <Button
            sx={{
              height: '42px',
              marginTop: '10px',
              ...customStyles,
              ...MUIMediaStyle,
            }}
            onClick={() => endActing()}
            variant="contained"
            startIcon={<GroupIcon />}
          >
            {salesRepCompanyName}
          </Button>
        </Snackbar>
      )}

      {!isOpen && !isMobile && (
        <Snackbar
          sx={{
            zIndex: '9999999999',
            borderRadius: '4px',
            height: '52px',
            fontSize: '16px',
            ...getPosition(horizontalPadding, verticalPadding, location),
            ...sx,
            ...customStyles,
            ...MUIMediaStyle,
          }}
          anchorOrigin={getLocation(location) || defaultLocation}
          open
        >
          <Box
            sx={{
              padding: '5px 15px',
              width: '100%',
            }}
          >
            {!isMobile && (
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
                {isExpansion && (
                  <Box
                    sx={{
                      fontWeight: 400,
                    }}
                  >
                    You are masqueraded as
                  </Box>
                )}
                <Box
                  sx={{
                    fontWeight: '600',
                    m: '0 15px 0 10px',
                  }}
                >
                  {salesRepCompanyName}
                </Box>
                {isExpansion && (
                  <Box
                    sx={{
                      fontWeight: 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    onClick={() => endActing()}
                  >
                    {text}
                  </Box>
                )}

                {isExpansion ? (
                  <KeyboardArrowLeftIcon
                    onClick={() => isMasqueradeTipExpansion(false)}
                    sx={{
                      ml: '10px',
                      cursor: 'pointer',
                    }}
                  />
                ) : (
                  <KeyboardArrowRightIcon
                    onClick={() => isMasqueradeTipExpansion(true)}
                    sx={{
                      ml: '10px',
                      cursor: 'pointer',
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Snackbar>
      )}

      {isOpen && !isMobile && (
        <Snackbar
          sx={{
            zIndex: '9999999999',
            borderRadius: '4px',
            height: '52px',
            ...customStyles,
            ...customBuyerPortalPagesStyles,
            ...sx,
          }}
          anchorOrigin={defaultLocation}
          open
        >
          <Box
            sx={{
              padding: '5px 15px',
              width: '100%',
            }}
          >
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
              {isExpansion && (
                <Box
                  sx={{
                    fontWeight: 400,
                  }}
                >
                  You are masqueraded as
                </Box>
              )}
              <Box
                sx={{
                  fontWeight: '600',
                  m: '0 15px 0 10px',
                }}
              >
                {salesRepCompanyName}
              </Box>
              {isExpansion && (
                <Box
                  sx={{
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onClick={() => endActing()}
                >
                  {text}
                </Box>
              )}

              {isExpansion ? (
                <KeyboardArrowLeftIcon
                  onClick={() => isMasqueradeTipExpansion(false)}
                  sx={{
                    ml: '10px',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <KeyboardArrowRightIcon
                  onClick={() => isMasqueradeTipExpansion(true)}
                  sx={{
                    ml: '10px',
                    cursor: 'pointer',
                  }}
                />
              )}
            </Box>
          </Box>
        </Snackbar>
      )}

      {isOpen && isMobile && (
        <Snackbar
          sx={{
            zIndex: '9999999999',
            borderRadius: '4px',
            height: '52px',
            ...sx,
            ...isMobileCustomStyles,
          }}
          anchorOrigin={defaultLocation}
          open
        >
          <Box
            sx={{
              padding: '5px 15px',
              width: '100%',
            }}
          >
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
                  {salesRepCompanyName}
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
                END MASQUERADE
              </Box>
            </Box>
          </Box>
        </Snackbar>
      )}
    </>
  )
}
