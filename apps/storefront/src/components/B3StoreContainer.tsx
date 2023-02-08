import {
  ReactNode,
  useEffect,
  useContext,
} from 'react'

import {
  getBCStoreChannelId,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'
import {
  getCurrentStoreInfo,
} from '@/utils/loginInfo'

import {
  B3SStorage,
  showPageMask,
} from '@/utils'

interface B3StoreContainerProps {
  children: ReactNode
}

interface StoreItem {
  channelId: number,
  urls: Array<string>,
  b2bEnabled: boolean,
  channelLogo: string,
  isEnabled: boolean,
  b3ChannelId: number,
}

export interface StoreBasicInfo {
  storeSites?: Array<StoreItem> | [],
  storeName: string,
}

export const B3StoreContainer = (props: B3StoreContainerProps) => {
  const {
    state: {
      storeEnabled,
    },
    dispatch,
  } = useContext(GlobaledContext)

  useEffect(() => {
    const getStoreBasicInfo = async () => {
      if (window.location.pathname.includes('account.php')) {
        showPageMask(true)
      }

      try {
        const {
          storeBasicInfo,
        }: CustomFieldItems = await getBCStoreChannelId()

        const {
          channelId,
          channelLogo: logo,
          b3ChannelId: b2bChannelId,
          b2bEnabled: storeEnabled,
        } = getCurrentStoreInfo((storeBasicInfo as StoreBasicInfo)?.storeSites || [])

        dispatch({
          type: 'common',
          payload: {
            logo,
            storeEnabled,
            currentChannelId: channelId,
            b2bChannelId,
            storeName: storeBasicInfo.storeName,
          },
        })

        if (!storeEnabled) {
          showPageMask(false)
        }

        B3SStorage.set('B3channelId', channelId)
      } catch (error) {
        showPageMask(false)
      }
    }
    getStoreBasicInfo()
  }, [])

  const {
    children,
  } = props

  return (
    <>
      {storeEnabled ? children : null}
    </>
  )
}
