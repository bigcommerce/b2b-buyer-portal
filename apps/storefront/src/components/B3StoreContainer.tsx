import { ReactNode, useContext, useLayoutEffect } from 'react'
import globalB3 from '@b3/global-b3'

import { GlobaledContext } from '@/shared/global'
import { getBCStoreChannelId } from '@/shared/service/b2b'
import {
  getGlobalTranslations,
  setHeadLessBcUrl,
  setStoreInfo,
  useAppDispatch,
} from '@/store'
import { setTimeFormat } from '@/store/slices/storeInfo'
import { B3SStorage, storeHash } from '@/utils'

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
  const storeDispatch = useAppDispatch()

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

        storeDispatch(setStoreInfo(storeInfo))

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
            multiStorefrontEnabled: storeBasicInfo.multiStorefrontEnabled,
          },
        })

        if (!isEnabled) {
          showPageMask(dispatch, false)
        }

        storeDispatch(
          getGlobalTranslations({
            newVersion: translationVersion,
            channelId: storeBasicInfo.multiStorefrontEnabled ? channelId : 0,
          })
        )

        storeDispatch(
          setHeadLessBcUrl(
            globalB3?.setting?.is_local_debugging ? '/bigcommerce' : bcUrl
          )
        )

        storeDispatch(setTimeFormat(storeBasicInfo.timeFormat))
        B3SStorage.set('B3channelId', channelId)
        B3SStorage.set('bcUrl', bcUrl)
        sessionStorage.setItem('currentB2BEnabled', JSON.stringify(isEnabled))
      } catch (error) {
        showPageMask(dispatch, false)
      }
    }
    getStoreBasicInfo()
    // disabling because dispatchers are not supposed to be here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { children } = props

  return (
    <>
      {storeEnabled ? children : null}
      <B3PageMask />
    </>
  )
}
