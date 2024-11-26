import { useContext, useEffect, useMemo } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Badge, List, ListItem, ListItemButton, ListItemText, useTheme } from '@mui/material';

import { PATH_ROUTES } from '@/constants';
import { useMobile } from '@/hooks';
import { DynamicallyVariableedContext } from '@/shared/dynamicallyVariable';
import { GlobalContext } from '@/shared/global';
import { getAllowedRoutes } from '@/shared/routes';
import { store, useAppSelector } from '@/store';
import {
  setCompanyHierarchyInfoModules,
  setPagesSubsidiariesPermission,
} from '@/store/slices/company';
import { PagesSubsidiariesPermissionProps } from '@/types';
import { B3SStorage } from '@/utils';
import { verifyCompanyLevelPermissionByCode } from '@/utils/b3CheckPermissions';

import { b3HexToRgb, getContrastColor } from '../outSideComponents/utils/b3CustomStyles';

interface B3NavProps {
  closeSidebar?: (x: boolean) => void;
}

export default function B3Nav({ closeSidebar }: B3NavProps) {
  const [isMobile] = useMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const b3Lang = useB3Lang();

  const { dispatch } = useContext(DynamicallyVariableedContext);
  const role = useAppSelector(({ company }) => company.customer.role);

  const { selectCompanyHierarchyId, isEnabledCompanyHierarchy } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const { permissions } = useAppSelector(({ company }) => company);

  const { state: globalState } = useContext(GlobalContext);
  const { quoteDetailHasNewMessages, registerEnabled } = globalState;

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const jumpRegister = () => {
    navigate('/register');
    dispatch({
      type: 'common',
      payload: {
        globalMessageDialog: {
          open: false,
          title: '',
          message: '',
          cancelText: 'Cancel',
        },
      },
    });
  };

  const handleClick = (item: { configKey?: string; path: string }) => {
    if (role === 100) {
      dispatch({
        type: 'common',
        payload: {
          globalMessageDialog: {
            open: true,
            title: 'Registration',
            message:
              item.configKey === 'shoppingLists'
                ? 'Please create an account, or login to create a shopping list.'
                : 'To receive full access to buyer portal, please register. It will take 2 minutes.',
            cancelText: 'Cancel',
            saveText: registerEnabled ? 'Register' : '',
            saveFn: jumpRegister,
          },
        },
      });

      return;
    }

    navigate(item.path);
    if (isMobile && closeSidebar) {
      closeSidebar(false);
    }
  };

  useEffect(() => {
    let isHasSubsidiariesCompanyPermission = true;
    const { hash } = window.location;
    const url = hash.split('#')[1] || '';
    const routes = getAllowedRoutes(globalState).filter((route) => route.isMenuItem);

    if (url) {
      const routeItem = routes.find((item) => {
        return matchPath(item.path, url);
      });

      if (routeItem && routeItem?.subsidiariesCompanyKey) {
        const { permissionCodes } = routeItem;

        const code = permissionCodes?.includes(',')
          ? permissionCodes.split(',')[0].trim()
          : permissionCodes;

        isHasSubsidiariesCompanyPermission = verifyCompanyLevelPermissionByCode({
          code,
          level: 3,
        });
      }
    }

    store.dispatch(
      setCompanyHierarchyInfoModules({
        ishasCurrentPagePermission: isHasSubsidiariesCompanyPermission,
      }),
    );

    if (!isHasSubsidiariesCompanyPermission && selectCompanyHierarchyId) {
      navigate(PATH_ROUTES.COMPANY_HIERARCHY);
    }
  }, [selectCompanyHierarchyId, globalState, navigate]);

  const newRoutes = useMemo(() => {
    let routes = getAllowedRoutes(globalState).filter((route) => route.isMenuItem);

    const subsidiariesPermission = routes.reduce((all, cur) => {
      if (cur?.subsidiariesCompanyKey) {
        const code = cur.permissionCodes?.includes(',')
          ? cur.permissionCodes.split(',')[0].trim()
          : cur.permissionCodes;

        all[cur.subsidiariesCompanyKey] = verifyCompanyLevelPermissionByCode({
          level: 3,
          code,
        });
      }

      return all;
    }, {} as PagesSubsidiariesPermissionProps);

    store.dispatch(setPagesSubsidiariesPermission(subsidiariesPermission));

    if (selectCompanyHierarchyId) {
      routes = routes.filter(
        (route) =>
          !route?.subsidiariesCompanyKey || subsidiariesPermission[route.subsidiariesCompanyKey],
      );
    } else {
      routes = routes.filter(
        (route) => !(route?.configKey === 'companyHierarchy' && !isEnabledCompanyHierarchy),
      );
    }

    return routes;

    // ignore permissions because verifyCompanyLevelPermissionByCode method with permissions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectCompanyHierarchyId, permissions, globalState, isEnabledCompanyHierarchy]);

  const activePath = (path: string) => {
    if (location.pathname === path) {
      B3SStorage.set('prevPath', path);
      return true;
    }

    if (location.pathname.includes('orderDetail')) {
      const gotoOrderPath =
        B3SStorage.get('prevPath') === '/company-orders' ? '/company-orders' : '/orders';
      if (path === gotoOrderPath) return true;
    }

    if (location.pathname.includes('shoppingList') && path === '/shoppingLists') {
      return true;
    }

    if (location.pathname.includes('/quoteDetail') || location.pathname.includes('/quoteDraft')) {
      if (path === '/quotes') return true;
    }

    return false;
  };

  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: `${isMobile ? 'background.paper' : 'background.default'}`,
        color: primaryColor || 'info.main',
        '& .MuiListItem-root': {
          '& .MuiButtonBase-root.Mui-selected': {
            color: getContrastColor(primaryColor) || '#fff',
            bgcolor: 'primary.main',
            borderRadius: '4px',
          },
          '& .MuiButtonBase-root:hover:not(.Mui-selected)': {
            bgcolor: b3HexToRgb(primaryColor, 0.12),
            borderRadius: '4px',
          },
        },
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {newRoutes.map((item) => {
        if (item.name === 'Quotes') {
          const { pathname } = location;
          return (
            <ListItem key={item.path} disablePadding>
              <Badge
                badgeContent={
                  quoteDetailHasNewMessages && pathname.includes('quoteDetail') ? '' : 0
                }
                variant="dot"
                sx={{
                  width: '100%',
                  '& .MuiBadge-badge.MuiBadge-dot': {
                    width: 8,
                    height: 8,
                    bgcolor: '#FFFFFF',
                    right: 14,
                    top: 22,
                  },
                }}
              >
                <ListItemButton onClick={() => handleClick(item)} selected={activePath(item.path)}>
                  <ListItemText primary={b3Lang(item.idLang)} />
                </ListItemButton>
              </Badge>
            </ListItem>
          );
        }
        return (
          <ListItem key={item.path} disablePadding>
            <ListItemButton onClick={() => handleClick(item)} selected={activePath(item.path)}>
              <ListItemText primary={b3Lang(item.idLang)} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
