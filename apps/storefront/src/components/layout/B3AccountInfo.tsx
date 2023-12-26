import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'

import B3DropDown from '../B3DropDown'

interface ListProps {
  [key: string]: string
}

const list: Array<ListProps> = [
  {
    name: 'Log out',
    key: 'logout',
    type: 'button',
  },
]

interface B3AccountInfoProps {
  closeSidebar?: (x: boolean) => void
}

export default function B3AccountInfo({ closeSidebar }: B3AccountInfoProps) {
  const [isMobile] = useMobile()

  const {
    state: {
      customer: { firstName = '', lastName = '' },
    },
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const handleItemClick = async (item: ListProps) => {
    if (item.key === 'logout') {
      navigate('/login?loginFlag=3')
    } else if (item.type === 'path') {
      navigate(item.key)
    }
    if (closeSidebar) {
      closeSidebar(false)
    }
  }

  const name = `${firstName}  ${lastName}`

  return (
    <Box
      sx={{
        minWidth: '150px',
        display: 'flex',
        justifyContent: isMobile ? 'start' : 'end',
        mr: '-5px',
        fontSize: '16px',
        color: '#333333',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      <B3DropDown title={name} handleItemClick={handleItemClick} list={list} />
    </Box>
  )
}
