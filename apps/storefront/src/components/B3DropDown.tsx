import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import {
  Box,
} from '@mui/material'

import {
  useState,
  ReactElement,
  MouseEvent,
} from 'react'

type configProps = {
    name: string,
    key: string | number,
}

interface B3DropDownProps<T> {
  width?: string,
  list: Array<T>,
  config?: configProps,
  title: string,
  handleItemClick: (arg0: T) => void,
}

export const B3DropDown: <T>(props: B3DropDownProps<T>) => ReactElement = ({
  width,
  list,
  config,
  title,
  handleItemClick,
}) => {
  const [open, setOpen] = useState<null | HTMLElement>(null)

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget)
  }

  const handleCloseMenuClick = () => {
    setOpen(null)
  }

  const keyName = config?.name || 'name'

  return (
    <Box
      sx={{
        width: width || '200px',
      }}
    >
      <ListItemButton
        onClick={handleClick}
      >
        <ListItemText primary={title} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Menu
        anchorEl={open}
        open={Boolean(open)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        id="customized-menu"
        keepMounted
        onClose={handleCloseMenuClick}
      >

        {
          list.length && list.map((item) => {
            const name = (item as any)[keyName]
            return (
              <MenuItem
                sx={{
                  width: width || '200px',
                }}
                key={name}
                onClick={() => {
                  handleCloseMenuClick()
                  handleItemClick(item)
                }}
              >
                <ListItemText primary={name} />
              </MenuItem>
            )
          })
        }

      </Menu>
    </Box>
  )
}
