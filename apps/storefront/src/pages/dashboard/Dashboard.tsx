import {
  useEffect,
  useContext,
  useState,
} from 'react'

import {
  Box,
} from '@mui/material'
import {
  getAgentInfo,
  superAdminCompanies,
  superAdminBeginMasquerade,
  superAdminEndMasquerade,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3SStorage,
  storeHash,
} from '@/utils'

const Dashboard = () => {
  const {
    state: {
      isB2BUser,
      isAgenting,
      role,
      customerId,
      B3UserId,
      salesRepCompanyId,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const [list, setList] = useState([])
  // const [companyId, setCompanyId] = useState('')

  const init = async () => {
    let isAgenting = false
    let salesRepCompanyId = ''
    let salesRepCompanyName = ''

    if (isB2BUser && role === 3) {
      try {
        const data: any = await getAgentInfo(customerId)
        if (data?.superAdminMasquerading) {
          const {
            id,
            companyName,
          } = data.superAdminMasquerading
          B3SStorage.set('isAgenting', true)
          salesRepCompanyId = id
          salesRepCompanyName = companyName
          isAgenting = true

          dispatch(
            {
              type: 'common',
              payload: {
                salesRepCompanyId,
                salesRepCompanyName,
                isAgenting,
              },
            },
          )
        }
        const {
          superAdminCompanies: {
            edges: list = [],
          },
        }: any = await superAdminCompanies(+B3UserId)

        setList(list)
      } catch (error) {
        console.log(error)
      }
    }
  }

  useEffect(() => {
    init()
  }, [])

  const startActing = async (companyId: number) => {
    await superAdminBeginMasquerade(companyId, +B3UserId)
    init()
  }

  const endActing = async (companyId: number) => {
    await superAdminEndMasquerade(companyId, +B3UserId)
    B3SStorage.delete('isAgenting')
    dispatch(
      {
        type: 'common',
        payload: {
          salesRepCompanyId: '',
          salesRepCompanyName: '',
          isAgenting: false,
        },
      },
    )
    init()
  }

  return (
    <Box>
      {
        isB2BUser && role === 3 && list.length
        && list.map((item: any) => (
          <Box
            sx={{
              display: 'flex',
            }}
          >
            <Box key={item.node.companyId}>
              {
                item.node.companyId === +salesRepCompanyId ? '代理中' : '未代理'
              }
            </Box>
            {item.node.companyName}
            {item.node.companyId}
            {
              item.node.companyId === +salesRepCompanyId && (
              <Box
                sx={{
                  m: 2,
                }}
                onClick={() => endActing(item.node.companyId)}
              >
                结束代理
              </Box>
              )
            }
            {
              item.node.companyId !== +salesRepCompanyId && (
              <Box
                sx={{
                  m: 2,
                }}
                onClick={() => startActing(item.node.companyId)}
              >
                开始代理
              </Box>
              )
            }

          </Box>
        ))

      }
      {
        isB2BUser && role !== 3 && <Box>B2BUser</Box>
      }
      {
        !isB2BUser && <Box>BCUser</Box>
      }
    </Box>
  )
}

export default Dashboard
