import {
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  GlobaledContext,
} from '@/shared/global'

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

export const B3Mainheader = ({
  title,
}: {
  title: string
}) => {
  const {
    state: {
      companyInfo,
      salesRepCompanyName,
    },
  } = useContext(GlobaledContext)

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
