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
  B3SStorage,
} from '@/utils'

// import {
//   NavMessage,
// } from './styled'

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
    state: globalState,
    dispatch,
  } = useContext(GlobaledContext)

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
    const activeStyle = {
      color: 'white',
      bgcolor: '#3385d6',
      borderRadius: '4px',
    }
    if (location.pathname === path) {
      B3SStorage.set('nextPath', path)
      return activeStyle
    }

    if (location.pathname.includes('orderDetail')) {
      const gotoOrderPath = B3SStorage.get('nextPath') === '/company-orders' ? '/company-orders' : '/orders'
      if (path === gotoOrderPath) return activeStyle
    }

    if (location.pathname.includes('shoppingList') && path === '/shoppingLists') {
      return activeStyle
    }

    if (location.pathname.includes('/quoteDetail') || location.pathname.includes('/quoteDraft')) {
      if (path === '/quotes') return activeStyle
    }

    return {}
  }
  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: `${isMobile ? 'white' : '#fef9f5'}`,
        color: '#3385d6',
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {
        newRoutes.map((item: RouteItem) => (
          <ListItem
            sx={{
              '&:hover': {
                color: 'white',
                bgcolor: '#3385d6',
                borderRadius: '4px',
                '& .navMessage': {
                  bgcolor: 'white',
                  color: '#3385d6',
                },
              },
              ...activePath(item.path),
            }}
            onClick={() => handleClick(item)}
            key={item.path}
            disablePadding
          >
            <ListItemButton>
              <ListItemText primary={item.name} />
              {/* <NavMessage className="navMessage">5</NavMessage> */}
            </ListItemButton>
          </ListItem>
        ))
      }
    </List>
  )
}
