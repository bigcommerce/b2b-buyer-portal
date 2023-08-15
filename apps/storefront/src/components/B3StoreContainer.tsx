import { ReactNode, useContext, useLayoutEffect } from 'react'

import { B3PageMask, showPageMask } from '@/components'
import { GlobaledContext } from '@/shared/global'
import { getBCStoreChannelId } from '@/shared/service/b2b'
import { setHeadLessBcUrl, store } from '@/store'
import { B3SStorage, storeHash } from '@/utils'
import { getCurrentStoreInfo } from '@/utils/loginInfo'

interface B3StoreContainerProps {
  children: ReactNode
}

interface StoreItem {
  channelId: number
  urls: Array<string>
  b2bEnabled: boolean
  channelLogo: string
  isEnabled: boolean
  b3ChannelId: number
  type: string
  platform: string
}

export interface StoreBasicInfo {
  storeSites?: Array<StoreItem> | []
  storeName: string
}

export function B3StoreContainer(props: B3StoreContainerProps) {
  const {
    state: { storeEnabled },
    dispatch,
  } = useContext(GlobaledContext)

  useLayoutEffect(() => {
    const getStoreBasicInfo = async () => {
      if (
        window.location.pathname.includes('account.php') ||
        window.location.hash
      ) {
        showPageMask(dispatch, true)
      }

      try {
        const { storeBasicInfo }: CustomFieldItems = await getBCStoreChannelId()

        const storeInfo = getCurrentStoreInfo(
          (storeBasicInfo as StoreBasicInfo)?.storeSites || [],
          storeBasicInfo.multiStorefrontEnabled
        )

        if (!storeInfo?.channelId) return

        const {
          channelId,
          b3ChannelId: b2bChannelId,
          b2bEnabled: storeEnabled,
          platform,
        } = storeInfo

        const bcUrl =
          platform === 'next'
            ? `https://store-${storeHash}-${channelId}.mybigcommerce.com`
            : ''
        const isEnabled = storeBasicInfo?.multiStorefrontEnabled
          ? storeEnabled
          : true

        dispatch({
          type: 'common',
          payload: {
            storeEnabled: isEnabled,
            currentChannelId: channelId,
            b2bChannelId,
            storeName: storeBasicInfo.storeName,
            timeFormat: storeBasicInfo.timeFormat,
          },
        })

        if (!isEnabled) {
          showPageMask(dispatch, false)
        }

        store.dispatch(setHeadLessBcUrl(bcUrl))
        B3SStorage.set('timeFormat', storeBasicInfo.timeFormat)
        B3SStorage.set('B3channelId', channelId)
        B3SStorage.set('bcUrl', bcUrl)
        sessionStorage.setItem('currentB2BEnabled', JSON.stringify(isEnabled))
      } catch (error) {
        showPageMask(dispatch, false)
      }
    }
    getStoreBasicInfo()
  }, [])

  const { children } = props

  return (
    <>
      {storeEnabled ? children : null}
      <B3PageMask />
    </>
  )
}
