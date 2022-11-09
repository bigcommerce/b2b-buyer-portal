import {
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'
import {
  useNavigate,
} from 'react-router-dom'
import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

// import {
//   B3DropDown,
// } from '../B3DropDown'

interface ListProps {
  [key: string]: string
}

const list: Array<ListProps> = [
  {
    name: 'Account Setting',
    key: '/account-settings',
    type: 'path',
  },
  {
    name: 'Log out',
    key: 'logout',
    type: 'button',
  },
]

interface B3AccountInfoProps {
  closeSidebar?: (x: boolean) => void;
}

export const B3AccountInfo = ({
  closeSidebar,
}: B3AccountInfoProps) => {
  const [isMobile] = useMobile()

  const {
    state: {
      customer: {
        firstName = '',
        lastName = '',
      },
    },
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const handleItemClick = (item: ListProps) => {
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
    <>
      {
      isMobile ? (
        <Box
          sx={{
            pb: '5vw',
          }}
        >
          <Box
            component="h5"
            sx={{
              m: 0,
              p: '2vw 4vw',
            }}
          >
            Logged in as
            {' '}
            {name}
          </Box>
          {
            list.map((item) => (
              <Box
                sx={{
                  p: '2vw 4vw',
                  color: '#3385d6',
                }}
                onClick={() => handleItemClick(item)}
              >
                {item.name}
              </Box>
            ))
          }
        </Box>
      ) : (
        <Box sx={{
          width: '150px',
          display: 'flex',
          justifyContent: 'end',
          mr: '8px',
        }}
        >
          { name }
          {/* <B3DropDown
            title={name}
            width="150px"
            handleItemClick={handleItemClick}
            list={list}
          /> */}

        </Box>
      )
    }

    </>

  )
}
