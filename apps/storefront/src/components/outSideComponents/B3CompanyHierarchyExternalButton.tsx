import { useContext, useMemo } from 'react';
import { useB3Lang } from '@b3/lang';
import BusinessIcon from '@mui/icons-material/Business';
import { Box, SnackbarOrigin, SxProps } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';

import { PATH_ROUTES, Z_INDEX } from '@/constants';
import useMobile from '@/hooks/useMobile';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { useAppSelector } from '@/store';

import {
  getContrastColor,
  getLocation,
  getPosition,
  getStyles,
  setMUIMediaStyle,
  splitCustomCssValue,
} from './utils/b3CustomStyles';

const bottomHeightPage = ['shoppingList/', 'purchased-products'];

interface B3CompanyHierarchyExternalButtonProps {
  isOpen: boolean;
  setOpenPage: SetOpenPage;
}
function B3CompanyHierarchyExternalButton({
  setOpenPage,
  isOpen,
}: B3CompanyHierarchyExternalButtonProps) {
  const b3Lang = useB3Lang();

  const { hash } = window.location;

  const [isMobile] = useMobile();

  const { selectCompanyHierarchyId, companyHierarchyList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);

  const isAddBottom = bottomHeightPage.some((item: string) => hash.includes(item));

  const {
    state: { switchAccountButton },
  } = useContext(CustomStyleContext);

  const defaultLocation: SnackbarOrigin = {
    vertical: 'bottom',
    horizontal: 'left',
  };

  const {
    color = '',
    customCss = '',
    location = 'bottomLeft',
    horizontalPadding = '',
    verticalPadding = '',
  } = switchAccountButton;

  const cssInfo = splitCustomCssValue(customCss);
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string;
    mediaBlocks: string[];
  } = cssInfo;
  const MUIMediaStyle = setMUIMediaStyle(mediaBlocks);

  const baseStyles: SxProps = {
    backgroundColor: color || '#ED6C02',
    color: getContrastColor(color || '#FFFFFF'),
    bottom: salesRepCompanyId ? '90px !important' : 0,
    ...getStyles(cssValue),
  };

  const desktopStyles: SxProps = isAddBottom
    ? { bottom: salesRepCompanyId ? '180px !important' : '90px !important' }
    : {};
  const buyerPortalStyles: SxProps = {
    bottom: salesRepCompanyId ? '90px !important' : '24px',
    left: '24px',
    right: 'auto',
    top: 'unset',
  };
  const mobileOpenStyles: SxProps = {
    width: '100%',
    bottom: salesRepCompanyId ? '90px' : 0,
    left: 0,
  };

  let sx: SxProps = { ...baseStyles };

  if (isMobile) {
    if (isOpen) {
      sx = { ...sx, ...mobileOpenStyles };
    } else {
      sx = { ...sx, ...getPosition(horizontalPadding, verticalPadding, location) };
    }
  } else if (isOpen) {
    sx = { ...sx, ...buyerPortalStyles, ...desktopStyles };
  } else {
    sx = { ...sx, ...getPosition(horizontalPadding, verticalPadding, location), ...desktopStyles };
  }

  const companyName: string = useMemo(() => {
    if (!selectCompanyHierarchyId) {
      return '';
    }

    return (
      companyHierarchyList.find((company) => company.companyId === +selectCompanyHierarchyId)
        ?.companyName || ''
    );
  }, [selectCompanyHierarchyId, companyHierarchyList]);

  const { COMPANY_HIERARCHY } = PATH_ROUTES;

  return (
    <>
      {!!companyName && (
        <Snackbar
          sx={{
            zIndex: Z_INDEX.NOTIFICATION,
            height: '52px',
            borderRadius: '4px',
            fontSize: '16px',
            ...sx,
            ...MUIMediaStyle,
          }}
          anchorOrigin={getLocation(location) || defaultLocation}
          open
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
            onClick={() =>
              setOpenPage({
                isOpen: true,
                openUrl: COMPANY_HIERARCHY,
              })
            }
          >
            <BusinessIcon sx={{ fontSize: '20px' }} />
            <Box
              sx={{
                margin: '0 0.5rem',
              }}
            >
              {b3Lang('global.companyHierarchy.externalBtn')}
            </Box>
            <Box
              sx={{
                fontWeight: 'bold',
              }}
            >
              {companyName}
            </Box>
          </Box>
        </Snackbar>
      )}
    </>
  );
}

export default B3CompanyHierarchyExternalButton;
