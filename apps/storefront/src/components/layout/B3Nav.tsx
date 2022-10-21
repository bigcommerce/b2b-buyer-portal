import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import {
  useNavigate,
} from 'react-router-dom'
import {
  routes,
} from '@/shared/routes'

import {
  RouteItem,
} from '@/shared/routes/routes'

import {
  useMobile,
} from '@/hooks'

import {
  NavMessage,
} from './styled'

interface B3NavProps {
  closeSidebar?: (x: boolean) => void;
}

export const B3Nav = ({
  closeSidebar,
}: B3NavProps) => {
  const [isMobile] = useMobile()
  const navigate = useNavigate()

  const handleClick = (item: RouteItem) => {
    navigate(item.path)
    if (isMobile && closeSidebar) {
      closeSidebar(false)
    }
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
        routes.map((item: RouteItem) => (
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
            }}
            onClick={() => handleClick(item)}
            key={item.path}
            disablePadding
          >
            <ListItemButton>
              <ListItemText primary={item.name} />
              <NavMessage className="navMessage">5</NavMessage>
            </ListItemButton>
          </ListItem>
        ))
      }
    </List>
  )
}
