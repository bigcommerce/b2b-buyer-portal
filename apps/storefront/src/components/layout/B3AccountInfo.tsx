import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import { superAdminEndMasquerade } from '@/shared/service/b2b'
import { B3SStorage } from '@/utils'

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
      B3UserId,
      salesRepCompanyId = 0,
      isAgenting,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const handleItemClick = async (item: ListProps) => {
    if (item.key === 'logout') {
      try {
        if (isAgenting) {
          await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)

          B3SStorage.delete('isAgenting')
          B3SStorage.delete('salesRepCompanyId')
          B3SStorage.delete('salesRepCompanyName')

          dispatch({
            type: 'common',
            payload: {
              salesRepCompanyId: '',
              salesRepCompanyName: '',
              isAgenting: false,
            },
          })
        }
      } finally {
        navigate('/login?loginFlag=3')
      }
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
      }}
    >
      <B3DropDown title={name} handleItemClick={handleItemClick} list={list} />
    </Box>
  )
}
