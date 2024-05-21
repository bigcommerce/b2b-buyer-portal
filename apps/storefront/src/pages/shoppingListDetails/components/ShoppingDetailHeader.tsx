import { Dispatch, SetStateAction, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, Grid, styled, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';

import { ShoppingStatus } from '../../shoppingLists/ShoppingStatus';

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
}));

interface OpenPageState {
  isOpen: boolean;
  openUrl?: string;
}
interface ShoppingDetailHeaderProps {
  shoppingListInfo: any;
  role: string | number;
  customerInfo: any;
  goToShoppingLists: () => void;
  handleUpdateShoppingList: (status: number) => void;
  isB2BUser: boolean;
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>;
  isAgenting: boolean;
  openAPPParams: {
    shoppingListBtn: string;
  };
  customColor: string;
}

function ShoppingDetailHeader(props: ShoppingDetailHeaderProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const {
    shoppingListInfo,
    role,
    customerInfo,
    handleUpdateShoppingList,
    goToShoppingLists,
    isB2BUser,
    setOpenPage,
    isAgenting,
    openAPPParams,
    customColor,
  } = props;

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);
  const navigate = useNavigate();

  const isDisabledBtn = shoppingListInfo?.products?.edges.length === 0;

  const currentSLCreateRole = shoppingListInfo?.customerInfo?.role;

  const gridOptions = (xs: number) =>
    isMobile
      ? {}
      : {
          xs,
        };
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
          onClick={() => {
            if (openAPPParams.shoppingListBtn !== 'add') {
              goToShoppingLists();
            } else {
              navigate('/');
              setOpenPage({
                isOpen: false,
                openUrl: '',
              });
            }
          }}
        >
          <ArrowBackIosNew
            fontSize="small"
            sx={{
              fontSize: '12px',
              marginRight: '0.5rem',
              color: customColor,
            }}
          />
          <Box
            sx={{
              margin: 0,
              color: customColor,
              m: '0',
            }}
          >
            {openAPPParams.shoppingListBtn !== 'add'
              ? b3Lang('shoppingList.header.backToShoppingLists')
              : b3Lang('shoppingList.header.backToProduct')}
          </Box>
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
          sx={{
            color: getContrastColor(backgroundColor),
          }}
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
              }}
            >
              {`${shoppingListInfo?.name || ''}`}
            </Typography>
            {isB2BUser && +currentSLCreateRole === 2 && (
              <Typography
                sx={{
                  m: `${isMobile ? '10px 0' : '0'}`,
                }}
              >
                {shoppingListInfo && <ShoppingStatus status={shoppingListInfo?.status} />}
              </Typography>
            )}
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
            {isB2BUser && (
              <StyledCreateName>
                <Typography
                  variant="subtitle2"
                  sx={{
                    marginRight: '0.5rem',
                  }}
                >
                  {b3Lang('shoppingList.header.createdBy')}
                </Typography>
                <span>{`${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`}</span>
              </StyledCreateName>
            )}
          </Box>
        </Grid>

        <Grid
          item
          sx={{
            textAlign: `${isMobile ? 'none' : 'end'}`,
          }}
          {...gridOptions(4)}
        >
          {role === 2 && shoppingListInfo?.status === 30 && (
            <CustomButton
              variant="outlined"
              disabled={isDisabledBtn}
              onClick={() => {
                handleUpdateShoppingList(40);
              }}
            >
              {b3Lang('shoppingList.header.submitForApproval')}
            </CustomButton>
          )}
          {(role === 0 || role === 1 || (role === 3 && isAgenting)) &&
            shoppingListInfo?.status === 40 && (
              <Box>
                <CustomButton
                  variant="outlined"
                  sx={{
                    marginRight: '1rem',
                  }}
                  onClick={() => {
                    handleUpdateShoppingList(20);
                  }}
                >
                  {b3Lang('shoppingList.header.reject')}
                </CustomButton>
                <CustomButton
                  variant="outlined"
                  onClick={() => {
                    handleUpdateShoppingList(0);
                  }}
                >
                  {b3Lang('shoppingList.header.approve')}
                </CustomButton>
              </Box>
            )}
        </Grid>
      </Grid>
    </>
  );
}

export default ShoppingDetailHeader;
