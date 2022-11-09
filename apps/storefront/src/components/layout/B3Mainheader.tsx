import {
  useState,
  useEffect,
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  useLocation,
} from 'react-router-dom'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  routes,
} from '@/shared/routes'

import {
  RouteItem,
} from '@/shared/routes/routes'

import {
  B3AccountInfo,
} from './B3AccountInfo'
// import {
//   B3DropDown,
// } from '../B3DropDown'

// interface AcountListProps {
//   [key: string]: string
// }

// const acountList: Array<AcountListProps> = [
//   {
//     name: 'My Orders',
//     key: 'myOrder',
//     type: 'button',
//   },
//   {
//     name: 'Company orders',
//     key: 'companyOrder',
//     type: 'button',
//   },
// ]

export const B3Mainheader = () => {
  const location = useLocation()

  const [title, setTitle] = useState<string>('')

  const {
    state: {
      isCompanyAccount,
      companyInfo,
      salesRepCompanyName,
    },
  } = useContext(GlobaledContext)

  useEffect(() => {
    const itemsRoutes = routes.filter((item: RouteItem) => item.path === location.pathname)
    if (itemsRoutes.length) {
      setTitle(itemsRoutes[0].name)
    } else {
      setTitle('')
    }
  }, [location])

  // const handleItemClick = (item: AcountListProps) => {
  //   dispatch({
  //     type: 'common',
  //     payload: {
  //       isCompanyAccount: item.key === 'companyOrder',
  //     },
  //   })
  // }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '70px',
          alignItems: 'center',
        }}
      >
        <Box
          component="h4"
        >
          {companyInfo?.companyName || salesRepCompanyName}

          {/* <B3DropDown
            title="Renteach building"
            width="200px"
            value={isCompanyAccount ? 'companyOrder' : 'myOrder'}
            handleItemClick={handleItemClick}
            list={acountList}
          /> */}

        </Box>
        <B3AccountInfo />
      </Box>
      <Box
        component="h3"
        sx={{
          height: '40px',
          m: '0',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'end',
          mb: '8px',
        }}
      >
        {title}
      </Box>
    </Box>

  )
}
