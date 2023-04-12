import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'

import {
  useContext,
} from 'react'

import {
  useNavigate,
  useLocation,
} from 'react-router-dom'

import {
  getAllowedRoutes,
} from '@/shared/routes'

import {
  RouteItem,
} from '@/shared/routes/routes'

import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  DynamicallyVariableedContext,
} from '@/shared/dynamicallyVariable'

import {
  B3SStorage,
} from '@/utils'

import {
  getContrastColor,
} from '../outSideComponents/utils/b3CustomStyles'

import {
  CustomStyleContext,
} from '../../shared/customStyleButtton/context'

interface B3NavProps {
  closeSidebar?: (x: boolean) => void;
}

export const B3Nav = ({
  closeSidebar,
}: B3NavProps) => {
  const [isMobile] = useMobile()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    dispatch,
  } = useContext(DynamicallyVariableedContext)

  const {
    state: globalState,
  } = useContext(GlobaledContext)

  const {
    state: {
      portalStyle: {
        primaryColor = '',
      },
    },
  } = useContext(CustomStyleContext)

  const jumpRegister = () => {
    navigate('/registered')
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
    })
  }

  const handleClick = (item: RouteItem) => {
    const {
      role,
    } = globalState

    if (role === 100) {
      dispatch({
        type: 'common',
        payload: {
          globalMessageDialog: {
            open: true,
            title: 'Registration',
            message: 'To receive full access to buyer portal, please register. It will take 2 minutes. ',
            cancelText: 'Cancel',
            saveText: 'Register',
            saveFn: jumpRegister,
          },
        },
      })

      return
    }

    navigate(item.path)
    if (isMobile && closeSidebar) {
      closeSidebar(false)
    }
  }
  const menuItems = () => {
    const newRoutes = getAllowedRoutes(globalState).filter((route: RouteItem) => route.isMenuItem)

    return newRoutes
  }
  const newRoutes = menuItems()
  const activePath = (path: string) => {
    if (location.pathname === path) {
      B3SStorage.set('nextPath', path)
      return true
    }

    if (location.pathname.includes('orderDetail')) {
      const gotoOrderPath = B3SStorage.get('nextPath') === '/company-orders' ? '/company-orders' : '/orders'
      if (path === gotoOrderPath) return true
    }

    if (location.pathname.includes('shoppingList') && path === '/shoppingLists') {
      return true
    }

    if (location.pathname.includes('/quoteDetail') || location.pathname.includes('/quoteDraft')) {
      if (path === '/quotes') return true
    }

    return false
  }
  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: `${isMobile ? 'background.paper' : 'background.default'}`,
        color: primaryColor || 'info.main',
        '& .MuiButtonBase-root.Mui-selected, & .MuiButtonBase-root.Mui-selected:hover': {
          color: getContrastColor(primaryColor) || '#fff',
          bgcolor: primaryColor || 'primary.main',
        },
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {
        newRoutes.map((item: RouteItem) => (
          <ListItem
            key={item.path}
            disablePadding
          >
            <ListItemButton
              onClick={() => handleClick(item)}
              selected={activePath(item.path)}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))
      }
    </List>
  )
}
