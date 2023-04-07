import {
  ReactNode,
  useLayoutEffect,
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
} from '@/utils'

import {
  B3PageMask,
  showPageMask,
} from '@/components'

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

  useLayoutEffect(() => {
    const getStoreBasicInfo = async () => {
      if (window.location.pathname.includes('account.php') || window.location.hash) {
        showPageMask(dispatch, true)
      }

      try {
        const {
          storeBasicInfo,
        }: CustomFieldItems = await getBCStoreChannelId()

        const {
          channelId,
          b3ChannelId: b2bChannelId,
          b2bEnabled: storeEnabled,
        } = getCurrentStoreInfo((storeBasicInfo as StoreBasicInfo)?.storeSites || [])

        dispatch({
          type: 'common',
          payload: {
            storeEnabled,
            currentChannelId: channelId,
            b2bChannelId,
            storeName: storeBasicInfo.storeName,
          },
        })

        if (!storeEnabled) {
          showPageMask(dispatch, false)
        }

        B3SStorage.set('B3channelId', channelId)
      } catch (error) {
        showPageMask(dispatch, false)
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
      <B3PageMask />
    </>
  )
}
