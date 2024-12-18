import type { PersistConfig } from 'redux-persist/es/types';
import { KEY_PREFIX, REHYDRATE } from 'redux-persist/lib/constants';

import type { AppStore } from '.';

type CrossTabConfig<T> = Pick<PersistConfig<T>, 'blacklist' | 'whitelist'>;
type StoreObj = ReturnType<AppStore['getState']>;

function isStringRecord(
  objectToValidate: unknown,
): objectToValidate is Record<keyof StoreObj[keyof StoreObj], string> {
  if (typeof objectToValidate !== 'object' || objectToValidate === null) {
    return false;
  }

  const values = Object.values(objectToValidate);

  return !values.some((value) => typeof value !== 'string');
}

export default function crossTabSync(
  store: AppStore,
  key: keyof StoreObj,
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
    let statePartial: Record<keyof StoreObj[keyof StoreObj], string>;

    if (isStringRecord(parsed)) {
      statePartial = parsed;
    } else {
      return;
    }

    const newTemporaryState: StoreObj[keyof StoreObj] = {};
    const newState = Object.entries(statePartial).reduce((state, [reducerKey, storedValue]) => {
      if (whitelist?.indexOf(reducerKey) === -1) {
        return state;
      }

      if (blacklist && blacklist.indexOf(reducerKey) !== -1) {
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
