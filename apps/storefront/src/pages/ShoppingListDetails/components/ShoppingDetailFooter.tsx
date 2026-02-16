import { useContext, useRef, useState } from 'react';
import { ArrowDropDown, Delete } from '@mui/icons-material';
import { Box, Grid, Menu, MenuItem, Typography, useTheme } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import { snackbar } from '@/utils/b3Tip';

interface ShoppingDetailFooterProps {
  selectedProductCount: number;
  shoppingListInfo: any;
  allowJuniorPlaceOrder: boolean;
  selectedSubTotal: number;
  isB2BUser: boolean;
  isCanEditShoppingList: boolean;
  isJuniorBuyer: boolean;
  onDelete: () => void;
  onAddToCart: () => void;
  onAddToQuote: () => void;
}

function ShoppingDetailFooter({
  onDelete,
  onAddToCart,
  onAddToQuote,
  selectedProductCount,
  shoppingListInfo,
  allowJuniorPlaceOrder,
  selectedSubTotal,
  isB2BUser,
  isCanEditShoppingList,
  isJuniorBuyer,
}: ShoppingDetailFooterProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const theme = useTheme();
  const customColor = theme.palette.primary.main;

  const {
    state: { productQuoteEnabled = false },
  } = useContext(GlobalContext);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const {
    shoppingListCreateActionsPermission,
    purchasabilityPermission,
    submitShoppingListPermission,
  } = useAppSelector(rolePermissionSelector);
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      };

  const b2bShoppingListActionsPermission = isB2BUser ? shoppingListCreateActionsPermission : true;
  const isCanAddToCart = isB2BUser ? purchasabilityPermission : true;
  const b2bSubmitShoppingListPermission = isB2BUser ? submitShoppingListPermission : isJuniorBuyer;

  const handleOpenBtnList = () => {
    if (selectedProductCount === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAddSelectedToCart = () => {
    onAddToCart();
    handleClose();
  };

  const handleAddSelectedToQuote = () => {
    onAddToQuote();
    handleClose();
  };

  const buttons = {
    adSelectedToCart: {
      name: b3Lang('shoppingList.footer.addToCart'),
      key: 'add-selected-to-cart',
      handleClick: handleAddSelectedToCart,
    },
    proceedToCheckout: {
      name: b3Lang('shoppingList.footer.proceedToCheckout'),
      key: 'add-select-to-checkout',
      handleClick: handleAddSelectedToCart,
    },
    addSelectedToQuote: {
      name: b3Lang('shoppingList.footer.addToQuote'),
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
    },
  };

  const allowButtonList = () => {
    if (!(shoppingListInfo?.status === ShoppingListStatus.Approved || !isB2BUser)) return [];

    if (!isCanAddToCart && isB2BUser)
      return productQuoteEnabled ? [buttons.addSelectedToQuote] : [];

    if (b2bSubmitShoppingListPermission) {
      if (allowJuniorPlaceOrder && productQuoteEnabled) {
        return [buttons.proceedToCheckout, buttons.addSelectedToQuote];
      }

      if (allowJuniorPlaceOrder) return [buttons.proceedToCheckout];
      if (productQuoteEnabled) {
        return [buttons.addSelectedToQuote];
      }
      return [];
    }

    return productQuoteEnabled
      ? [buttons.adSelectedToCart, buttons.addSelectedToQuote]
      : [buttons.adSelectedToCart];
  };

  const buttonList = allowButtonList();

  return (
    <Grid
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: isMobile ? '0 0 1rem 0' : '0 40px 1rem 40px',
        height: isMobile ? '8rem' : 'auto',
        marginLeft: 0,
        display: 'flex',
        flexWrap: 'nowrap',
        zIndex: '999',
      }}
      container
      spacing={2}
    >
      <Grid
        item
        sx={{
          display: isMobile ? 'none' : 'block',
          width: '290px',
          paddingLeft: '20px',
        }}
      />
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
              }
            : {
                flexBasis: '690px',
                flexGrow: 1,
              }
        }
      >
        <Box
          sx={{
            width: '100%',
            pr: '20px',
            display: 'flex',
            zIndex: '999',
            justifyContent: 'space-between',
            ...containerStyle,
          }}
        >
          <Typography
            sx={{
              color: '#000000',
              fontSize: '16px',
              fontWeight: '400',
            }}
          >
            {b3Lang('shoppingList.footer.selectedProducts', {
              quantity: selectedProductCount,
            })}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {b3Lang('shoppingList.footer.subtotal', {
                subtotal: currencyFormat(selectedSubTotal),
              })}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: isMobile ? '0.5rem' : 0,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {!allowJuniorPlaceOrder &&
                isCanEditShoppingList &&
                b2bShoppingListActionsPermission && (
                  <CustomButton
                    sx={{
                      padding: '5px',
                      border: `1px solid ${customColor || '#1976d2'}`,
                      margin: isMobile ? '0 1rem 0 0' : '0 1rem',
                      minWidth: 'auto',
                    }}
                    disabled={shoppingListInfo?.status === ShoppingListStatus.ReadyForApproval}
                  >
                    <Delete
                      color="primary"
                      sx={{
                        color: customColor,
                      }}
                      onClick={onDelete}
                    />
                  </CustomButton>
                )}
              {buttonList.length ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: isMobile ? '0.5rem' : 0,
                    marginLeft: isMobile ? 0 : '20px',
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  {buttonList.length === 1 && buttonList[0] && (
                    <CustomButton
                      variant="contained"
                      onClick={buttonList[0].handleClick}
                      sx={{
                        marginRight: isMobile ? '1rem' : 0,
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {buttonList[0].name}
                    </CustomButton>
                  )}
                  {buttonList.length === 2 && (
                    <>
                      <CustomButton
                        variant="contained"
                        onClick={handleOpenBtnList}
                        ref={ref}
                        sx={{
                          marginRight: isMobile ? '1rem' : 0,
                          width: isMobile ? '100%' : 'auto',
                        }}
                        endIcon={<ArrowDropDown />}
                      >
                        {b3Lang('shoppingList.footer.addSelectedTo')}
                      </CustomButton>
                      <Menu
                        id="basic-menu"
                        anchorEl={ref.current}
                        open={isOpen}
                        onClose={handleClose}
                        MenuListProps={{
                          'aria-labelledby': 'basic-button',
                        }}
                      >
                        {buttonList.length > 1 &&
                          buttonList.map((button) => (
                            <MenuItem
                              key={button.key}
                              onClick={() => {
                                button.handleClick();
                              }}
                            >
                              {button.name}
                            </MenuItem>
                          ))}
                      </Menu>
                    </>
                  )}
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
                display: isMobile ? 'none' : 'block',
              }
            : {
                flexBasis: '340px',
                display: isMobile ? 'none' : 'block',
              }
        }
      />
    </Grid>
  );
}

export default ShoppingDetailFooter;
