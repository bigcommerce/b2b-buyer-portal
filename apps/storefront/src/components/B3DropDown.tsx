import { MouseEvent, useContext, useState } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Box } from '@mui/material'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'

import { getContrastColor } from './outSideComponents/utils/b3CustomStyles'

type ConfigProps = {
  name: string
  key: string | number
}

interface B3DropDownProps<T> {
  width?: string
  list: Array<T>
  config?: ConfigProps
  title: string
  handleItemClick: (arg0: T) => void
  value?: string
}

export default function B3DropDown<T>({
  width,
  list,
  config,
  title,
  value,
  handleItemClick,
}: B3DropDownProps<T>) {
  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const [open, setOpen] = useState<null | HTMLElement>(null)

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget)
  }

  const handleCloseMenuClick = () => {
    setOpen(null)
  }

  const keyName = config?.name || 'name'

  const [isMobile] = useMobile()

  const sx = isMobile
    ? {
        width: 'auto',
      }
    : {
        width: width || '155px',
      }

  return (
    <Box
      sx={{
        width: width || 'auto',
      }}
    >
      <ListItemButton
        onClick={handleClick}
        sx={{
          pr: 0,
          color: getContrastColor(backgroundColor),
        }}
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
        {list.length &&
          list.map((item: any) => {
            const name = item[keyName]
            const color = value === item.key ? '#3385d6' : 'black'
            return (
              <MenuItem
                sx={{
                  color,
                  ...sx,
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
          })}
      </Menu>
    </Box>
  )
}
