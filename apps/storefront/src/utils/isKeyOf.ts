export const isKeyOf = <T extends object>(obj: T, key: string | number | symbol): key is keyof T =>
  key in obj;
