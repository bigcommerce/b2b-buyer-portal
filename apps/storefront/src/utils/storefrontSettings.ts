import { getStorefrontSettings } from '@/shared/service/b2b';
import { store } from '@/store';
import { setBackorderDisplaySettings } from '@/store/slices/global';
import b2bLogger from '@/utils/b3Logger';

export const getStoreSettings = async () => {
  try {
    const { storefrontSettings } = await getStorefrontSettings();
    const settings = storefrontSettings?.backorderDisplaySettings;

    if (settings) {
      store.dispatch(
        setBackorderDisplaySettings({
          showQuantityOnBackorder: settings.showQuantityOnBackorder ?? false,
          showQuantityOnHand: settings.showQuantityOnHand ?? false,
          showBackorderMessage: settings.showBackorderMessage ?? false,
        }),
      );
    }
  } catch (error) {
    // backorderDisplaySettings defaults to all-false in initialState
    b2bLogger.error('Failed to load storefront settings:', error);
  }
};
