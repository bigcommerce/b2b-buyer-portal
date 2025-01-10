import type { PersistConfig } from 'redux-persist/es/types';
import { KEY_PREFIX, REHYDRATE } from 'redux-persist/lib/constants';

import type { AppStore } from '.';

type CrossTabConfig<T> = Pick<PersistConfig<T>, 'blacklist' | 'whitelist'>;
type StoreObj = ReturnType<AppStore['getState']>;
type StoreObjKeys = keyof StoreObj;

function isStringRecord(
  objectToValidate: unknown,
): objectToValidate is Record<keyof StoreObj[StoreObjKeys], string> {
  if (typeof objectToValidate !== 'object' || objectToValidate === null) {
    return false;
  }

  const values = Object.values(objectToValidate);

  return values.every((value) => typeof value === 'string');
}

export default function crossTabSync(
  store: AppStore,
  key: StoreObjKeys,
  crossTabConfig?: CrossTabConfig<AppStore>,
) {
  const { blacklist = null, whitelist = null } = crossTabConfig ?? {};

  window.addEventListener('storage', handleStorageEvent, false);

  function handleStorageEvent(e: StorageEvent) {
    if (`${KEY_PREFIX}${key}` !== e.key) {
      return;
    }

    if (!e.newValue || e.oldValue === e.newValue) {
      return;
    }

    const parsed: unknown = JSON.parse(e.newValue);
    let statePartial: Record<keyof StoreObj[StoreObjKeys], string>;

    if (isStringRecord(parsed)) {
      statePartial = parsed;
    } else {
      return;
    }

    const newTemporaryState: StoreObj[StoreObjKeys] = {};
    const newState = Object.entries(statePartial).reduce((state, [reducerKey, storedValue]) => {
      if (whitelist && !whitelist.includes(reducerKey)) {
        return state;
      }

      if (blacklist?.includes(reducerKey)) {
        return state;
      }

      /* eslint-disable */
      // @ts-ignore
      state[reducerKey] = JSON.parse(storedValue);
      /* eslint-enable */

      return state;
    }, newTemporaryState);

    store.dispatch({
      key,
      payload: newState,
      type: REHYDRATE,
    });
  }
}
