import { ReactNode, useContext, useLayoutEffect, useState } from 'react';

import { Z_INDEX } from '@/constants';
import { GlobalContext } from '@/shared/global';
import { getBCStoreChannelId } from '@/shared/service/b2b';
import {
  getGlobalTranslations,
  setBackorderEnabled,
  setStoreInfo,
  setTimeFormat,
  useAppDispatch,
} from '@/store';
import { removePreMountLoginMask, shouldUseDefaultLoginStyling } from '@/utils/preMountLoginMask';

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

  const [isDefaultLoginStyling] = useState(shouldUseDefaultLoginStyling);

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

        if (!storeInfo) {
          // No store site resolved, so App never mounts to clear the pre-mount
          // mask. Reveal the native login.php form instead of leaving it blocked.
          if (isDefaultLoginStyling) removePreMountLoginMask();
          return;
        }
        storeDispatch(setStoreInfo(storeInfo));
        storeDispatch(setBackorderEnabled(storeBasicInfo.backorderEnabled ?? false));

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
          // B2B is disabled for this store/channel, so App never mounts to clear
          // the pre-mount mask. Reveal the native login.php form here instead.
          if (isDefaultLoginStyling) removePreMountLoginMask();
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
        // Failed to resolve store info: don't leave the native login.php form
        // hidden behind the pre-mount mask.
        if (isDefaultLoginStyling) removePreMountLoginMask();
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
