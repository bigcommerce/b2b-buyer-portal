import {
  Link as RouterLink,
} from 'react-router-dom'

import {
  Home as HomeIcon,
  Logout as LogoutIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'

const drawerWidth = 240

export function Layout({
  close,
  children,
}: {
  close: () => void;
  children: any;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
          >
            B2B App
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <Divider />
        <List>
          {[
            {
              label: 'Home',
              to: '/',
              icon: HomeIcon,
            },
            {
              label: 'Form',
              to: '/form',
              icon: VerifiedUserIcon,
            },
            {
              label: 'Registered',
              to: '/registered',
              icon: VerifiedUserIcon,
            },
            {
              label: 'registeredbctob2b',
              to: '/registeredbctob2b',
              icon: VerifiedUserIcon,
            },
            {
              label: 'Login',
              to: '/login',
              icon: VerifiedUserIcon,
            },
          ].map(({
            label, icon: Icon,
            to,
          }) => (
            <ListItem
              disablePadding
              key={label}
            >
              <ListItemButton
                component={RouterLink}
                to={to}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={close}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Close" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
