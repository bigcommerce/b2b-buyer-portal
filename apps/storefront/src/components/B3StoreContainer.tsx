import { ReactNode, useCallback, useContext, useLayoutEffect } from 'react';

import { Z_INDEX } from '@/constants';
import { useLocaleSync } from '@/hooks/useLocaleSync';
import { GlobalContext } from '@/shared/global';
import { getBCStoreChannelId } from '@/shared/service/b2b';
import {
  getGlobalTranslations,
  resetTranslations,
  setStoreInfo,
  setTimeFormat,
  useAppDispatch,
} from '@/store';
import b2bLogger from '@/utils/b3Logger';

import { B3PageMask, usePageMask } from './loading';

interface B3StoreContainerProps {
  children: ReactNode;
}

type ZIndexType = keyof typeof Z_INDEX;
const setZIndexVariables = () => {
  Object.keys(Z_INDEX).forEach((key) => {
    const zIndexKey = key as ZIndexType;
    document.documentElement.style.setProperty(`--z-index-${key}`, Z_INDEX[zIndexKey].toString());
  });
};

export default function B3StoreContainer(props: B3StoreContainerProps) {
  const showPageMask = usePageMask();

  const {
    state: { storeEnabled },
    dispatch,
  } = useContext(GlobalContext);
  const storeDispatch = useAppDispatch();

  const handleLocaleChange = useCallback(
    async (newLocale: string) => {
      storeDispatch(resetTranslations());

      try {
        const { storeBasicInfo } = await getBCStoreChannelId();
        const [storeInfo] = storeBasicInfo.storeSites;

        if (storeInfo) {
          const { channelId, translationVersion } = storeInfo;

          storeDispatch(
            getGlobalTranslations({
              newVersion: translationVersion + 1,
              channelId: storeBasicInfo.multiStorefrontEnabled ? channelId : 0,
            }),
          );
        }
      } catch (error) {
        b2bLogger.error(`[B2B] Failed to refresh translations for locale ${newLocale}:`, error);
      }
    },
    [storeDispatch],
  );

  useLocaleSync(handleLocaleChange);

  useLayoutEffect(() => {
    const getStoreBasicInfo = async () => {
      if (
        window.location.pathname.includes('account.php') ||
        (window.location.hash && window.location.hash !== '#/')
      ) {
        showPageMask(true);
      }

      try {
        const { storeBasicInfo } = await getBCStoreChannelId();
        const [storeInfo] = storeBasicInfo.storeSites;

        if (!storeInfo) return;

        storeDispatch(setStoreInfo(storeInfo));

        const {
          channelId,
          b3ChannelId: b2bChannelId,
          b2bEnabled: storeEnabled,
          translationVersion,
        } = storeInfo;

        const isEnabled = storeBasicInfo?.multiStorefrontEnabled ? storeEnabled : true;

        dispatch({
          type: 'common',
          payload: {
            storeEnabled: isEnabled,
            b2bChannelId,
            storeName: storeBasicInfo.storeName,
            multiStorefrontEnabled: storeBasicInfo.multiStorefrontEnabled,
          },
        });

        if (!isEnabled) {
          showPageMask(false);
        }

        storeDispatch(
          getGlobalTranslations({
            newVersion: translationVersion,
            channelId: storeBasicInfo.multiStorefrontEnabled ? channelId : 0,
          }),
        );

        storeDispatch(setTimeFormat(storeBasicInfo.timeFormat));
        sessionStorage.setItem('currentB2BEnabled', JSON.stringify(isEnabled));
      } catch (error) {
        showPageMask(false);
      }
    };
    setZIndexVariables();
    getStoreBasicInfo();
    // disabling because dispatchers are not supposed to be here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { children } = props;

  return (
    <>
      {storeEnabled ? children : null}
      <B3PageMask />
    </>
  );
}
