import { useContext, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import {
  Group as GroupIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material';
import { Box, Button, SnackbarOrigin, SxProps } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Cookies from 'js-cookie';

import {
  CHECKOUT_URL,
  END_MASQUERADE_DEFAULT_VALUE,
  TRANSLATION_MASQUERADE_BUTTON_VARIABLE,
} from '@/constants';
import { useGetButtonText } from '@/hooks';
import useMobile from '@/hooks/useMobile';
import useStorageState from '@/hooks/useStorageState';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { superAdminEndMasquerade } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { clearMasqueradeCompany, setCartNumber, useAppDispatch, useAppSelector } from '@/store';

import { ConfirmMasqueradeDialog } from '../ConfirmMasqueradeDialog';

import {
  getContrastColor,
  getLocation,
  getPosition,
  getStyles,
  setMUIMediaStyle,
  splitCustomCssValue,
} from './utils/b3CustomStyles';

interface B3MasqueradeGlobalTipProps {
  isOpen: boolean;
  setOpenPage: SetOpenPage;
}

const bottomHeightPage = ['shoppingList/', 'purchased-products'];

function useData() {
  const customerId = useAppSelector(({ company }) => company.customer.id);
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const cartNumber = useAppSelector(({ global }) => global.cartNumber);
  const salesRepCompanyName = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.companyName,
  );
  const {
    state: { masqueradeButton },
  } = useContext(CustomStyleContext);

  return {
    customerId,
    b2bId,
    salesRepCompanyId,
    salesRepCompanyName,
    isAgenting,
    masqueradeButton,
    cartNumber,
  };
}

export default function B3MasqueradeGlobalTip(props: B3MasqueradeGlobalTipProps) {
  const { isOpen, setOpenPage } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [confirmEndActing, setConfirmEndActing] = useState(false);
  const dispatch = useAppDispatch();
  const {
    customerId,
    b2bId,
    salesRepCompanyId,
    salesRepCompanyName,
    isAgenting,
    masqueradeButton,
    cartNumber,
  } = useData();
  const { hash, href } = window.location;

  const b3Lang = useB3Lang();

  const {
    text = '',
    color = '',
    customCss = '',
    location = 'bottomLeft',
    horizontalPadding = '',
    verticalPadding = '',
  } = masqueradeButton;

  const buttonLabel = useGetButtonText(
    TRANSLATION_MASQUERADE_BUTTON_VARIABLE,
    text,
    END_MASQUERADE_DEFAULT_VALUE,
  );

  const isAddBottom = bottomHeightPage.some((item: string) => hash.includes(item));

  const [isExpansion, setExpansion] = useStorageState<boolean>(
    'sf-isMasqueradeTipExpansion',
    true,
    sessionStorage,
  );
  const [isMobile] = useMobile();

  const endActing = async () => {
    setIsLoading(true);
    if (typeof b2bId === 'number') {
      await superAdminEndMasquerade(Number(salesRepCompanyId));
    }

    const cartEntityId = Cookies.get('cartId');
    if (cartEntityId) {
      await deleteCart({ deleteCartInput: { cartEntityId } });
      Cookies.remove('cartId');
      dispatch(setCartNumber(0));
    }

    setIsLoading(false);
    dispatch(clearMasqueradeCompany());
    setOpenPage({
      isOpen: true,
      openUrl: '/dashboard',
    });
  };

  const onEndActing = async () => {
    if (cartNumber > 0) {
      setConfirmEndActing(true);
    } else {
      await endActing();
    }
  };

  if (href.includes(CHECKOUT_URL) || !customerId) return null;

  if (!isAgenting) return null;

  const defaultLocation: SnackbarOrigin = {
    vertical: 'bottom',
    horizontal: 'left',
  };

  let sx: SxProps = {};

  if (isMobile && isOpen) {
    sx = {
      width: '100%',
      bottom: 0,
      left: 0,
      borderRadius: '0px',
    };
  } else if (!isMobile && isAddBottom) {
    sx = {
      bottom: '90px !important',
    };
  }

  const cssInfo = splitCustomCssValue(customCss);
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string;
    mediaBlocks: string[];
  } = cssInfo;
  const MUIMediaStyle = setMUIMediaStyle(mediaBlocks);

  const customStyles: SxProps = {
    backgroundColor: color || '#ED6C02',
    color: getContrastColor(color || '#FFFFFF'),
    padding: '0',
    ...getStyles(cssValue),
  };

  const isMobileCustomStyles: SxProps = {
    backgroundColor: color || '#ED6C02',
    color: getContrastColor(color || '#FFFFFF'),
  };

  const customBuyerPortalPagesStyles: SxProps = {
    bottom: '24px',
    left: '24px',
    right: 'auto',
    top: 'unset',
  };

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
            onClick={onEndActing}
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
                    {b3Lang('global.masquerade.youAreMasqueradeAs')}
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
                    onClick={onEndActing}
                  >
                    {buttonLabel}
                  </Box>
                )}

                {isExpansion ? (
                  <KeyboardArrowLeftIcon
                    onClick={() => setExpansion(false)}
                    sx={{
                      ml: '10px',
                      cursor: 'pointer',
                    }}
                  />
                ) : (
                  <KeyboardArrowRightIcon
                    onClick={() => setExpansion(true)}
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
                  {b3Lang('global.masquerade.youAreMasqueradeAs')}
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
                  onClick={onEndActing}
                >
                  {buttonLabel}
                </Box>
              )}

              {isExpansion ? (
                <KeyboardArrowLeftIcon
                  onClick={() => setExpansion(false)}
                  sx={{
                    ml: '10px',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <KeyboardArrowRightIcon
                  onClick={() => setExpansion(true)}
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
                onClick={onEndActing}
              >
                {buttonLabel}
              </Box>
            </Box>
          </Box>
        </Snackbar>
      )}
      <ConfirmMasqueradeDialog
        title={b3Lang('dashboard.masqueradeModal.title.end')}
        isOpen={confirmEndActing}
        isRequestLoading={isLoading}
        handleClose={() => setConfirmEndActing(false)}
        handleConfirm={async () => {
          await endActing();
          setConfirmEndActing(false);
        }}
      />
    </>
  );
}
