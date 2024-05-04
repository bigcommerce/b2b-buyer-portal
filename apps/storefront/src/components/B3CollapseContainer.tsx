import { ReactElement, ReactNode, useEffect, useState } from 'react'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Box, Collapse, Typography } from '@mui/material'

interface CollapseContainerProps {
  title?: string | ReactElement
  header?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  handleOnChange?: (open: boolean) => void
}

export default function B3CollapseContainer(props: CollapseContainerProps) {
  const {
    children,
    title = '',
    header,
    defaultOpen = false,
    handleOnChange,
  } = props

  const [open, setOpen] = useState(defaultOpen)

  const handleClick = () => {
    setOpen(!open)
  }
  useEffect(() => {
    if (handleOnChange) handleOnChange(open)
  }, [handleOnChange, open])

  useEffect(() => {
    if (defaultOpen) {
      setOpen(defaultOpen)
    }
  }, [defaultOpen])

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          cursor: 'pointer',
          alignItems: 'center',
        }}
      >
        {header || <Typography variant="h5">{title}</Typography>}
        {open ? <ExpandLess /> : <ExpandMore />}
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
    </Box>
  )
}
