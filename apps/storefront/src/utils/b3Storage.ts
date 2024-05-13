enum StorageType {
  l = 'localStorage',
  s = 'sessionStorage',
}

class MyStorage {
  storage: Storage;

  prefix: string;

  constructor(type: StorageType) {
    this.storage = type === StorageType.l ? window.localStorage : window.sessionStorage;
    this.prefix = 'sf-';
  }

  set(key: string, value: any) {
    const data = JSON.stringify(value);
    this.storage.setItem(this.prefix + key, data);
  }

  get(key: string) {
    const value = this.storage.getItem(this.prefix + key);
    if (value) {
      return JSON.parse(value);
    }
    return undefined;
  }

  delete(key: string) {
    this.storage.removeItem(this.prefix + key);
  }

  clear() {
    this.storage.clear();
  }
}

const B3LStorage = new MyStorage(StorageType.l);
const B3SStorage = new MyStorage(StorageType.s);

export { B3LStorage, B3SStorage };
