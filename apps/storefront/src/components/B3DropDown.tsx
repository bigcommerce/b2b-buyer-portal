import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
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
  value?: string,
}

export const B3DropDown: <T>(props: B3DropDownProps<T>) => ReactElement = ({
  width,
  list,
  config,
  title,
  value,
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
        width: width || 'auto',
      }}
    >
      <ListItemButton
        onClick={handleClick}
      >
        <ListItemText primary={title} />
        {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      </ListItemButton>
      <Menu
        anchorEl={open}
        open={Boolean(open)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        id="customized-menu"
        keepMounted
        onClose={handleCloseMenuClick}
      >

        {
          list.length && list.map((item: any) => {
            const name = item[keyName]
            const color = value === item.key ? '#3385d6' : 'black'
            return (
              <MenuItem
                sx={{
                  width: width || '155px',
                  color,
                }}
                key={name}
                onClick={() => {
                  handleCloseMenuClick()
                  handleItemClick(item)
                }}
              >
                {name}
              </MenuItem>
            )
          })
        }

      </Menu>
    </Box>
  )
}
