import { ReactNode, useContext, useLayoutEffect } from 'react'

import { GlobaledContext } from '@/shared/global'
import { getBCStoreChannelId } from '@/shared/service/b2b'
import { setHeadLessBcUrl, setStoreInfo, store } from '@/store'
import { B3SStorage, setGlobalTranslation, storeHash } from '@/utils'

import B3PageMask from './loadding/B3PageMask'
import showPageMask from './loadding/B3showPageMask'

interface B3StoreContainerProps {
  children: ReactNode
}

export interface StoreItem {
  channelId: number
  urls: Array<string>
  b2bEnabled: boolean
  channelLogo: string
  isEnabled: boolean
  b3ChannelId: number
  type: string
  platform: string
  translationVersion: number
}

export interface StoreBasicInfo {
  storeSites?: Array<StoreItem> | []
  storeName: string
}

export default function B3StoreContainer(props: B3StoreContainerProps) {
  const {
    state: { storeEnabled },
    dispatch,
  } = useContext(GlobaledContext)

  useLayoutEffect(() => {
    const getStoreBasicInfo = async () => {
      if (
        window.location.pathname.includes('account.php') ||
        (window.location.hash && window.location.hash !== '#/')
      ) {
        showPageMask(dispatch, true)
      }

      try {
        const { storeBasicInfo }: CustomFieldItems = await getBCStoreChannelId()
        const [storeInfo] = storeBasicInfo.storeSites

        if (!storeInfo) return

        store.dispatch(setStoreInfo(storeInfo))

        const {
          channelId,
          b3ChannelId: b2bChannelId,
          b2bEnabled: storeEnabled,
          platform,
          translationVersion,
        } = storeInfo
        let bcUrl = ''

        if (platform !== 'bigcommerce') {
          if (channelId === 1) {
            bcUrl = `https://store-${storeHash}.mybigcommerce.com`
          } else {
            bcUrl = `https://store-${storeHash}-${channelId}.mybigcommerce.com`
          }
        }
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
            multiStorefrontEnabled: storeBasicInfo.multiStorefrontEnabled,
          },
        })

        if (!isEnabled) {
          showPageMask(dispatch, false)
        }

        if (translationVersion > 0) {
          setGlobalTranslation({
            translationVersion,
            channelId: storeBasicInfo.multiStorefrontEnabled ? channelId : 0,
          })
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
