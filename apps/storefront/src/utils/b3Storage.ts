// If you change one of this types, bear in mind the stored data
// will still be the old one, and you will need to handle it.
interface StorageStore {
  bcLanguage: string;
  blockPendingAccountOrderCreation: boolean;
  blockPendingAccountViewPrice: boolean;
  cartToQuoteId: string;
  isAgenting: boolean;
  isB2BUser: boolean;
  isShowBlockPendingAccountOrderCreationTip: {
    cartTip: number;
    checkoutTip: number;
  };
  loginCustomer: string;
  salesRepCompanyId: string;
  showInclusiveTaxPrice: boolean;
}

class MyStorage {
  prefix: string;

  constructor(private readonly storage: Storage) {
    this.prefix = 'sf-';
  }

  set<T extends keyof StorageStore>(key: T, value: StorageStore[T]) {
    const data = JSON.stringify(value);

    this.storage.setItem(this.prefix + key, data);
  }

  get<T extends keyof StorageStore>(key: T): StorageStore[T] | undefined {
    const value = this.storage.getItem(this.prefix + key);

    if (value) {
      return JSON.parse(value) as StorageStore[T];
    }

    return undefined;
  }

  delete(key: keyof StorageStore) {
    this.storage.removeItem(this.prefix + key);
  }

  clear() {
    this.storage.clear();
  }
}

const B3LStorage = new MyStorage(window.localStorage);
const B3SStorage = new MyStorage(window.sessionStorage);

export { B3LStorage, B3SStorage };
