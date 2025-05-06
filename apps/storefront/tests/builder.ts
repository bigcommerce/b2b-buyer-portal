import { mergeWith, range } from 'lodash';

type DeepPartial<T> = unknown extends T
  ? T
  : T extends object
  ? {
      [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
        ? ReadonlyArray<DeepPartial<U>>
        : DeepPartial<T[P]>;
    }
  : T;

const mergeCustomizer = <T>(objValue: T, srcValue: T) =>
  // Replace, rather than merge, arrays for more predictable results
  Array.isArray(objValue) ? srcValue : undefined;

type NonArray<T> = T extends unknown[] ? never : T;

export const builder =
  <T extends object, O = NonArray<T>>(getDefaults: () => O) =>
  (overrides: DeepPartial<T> | 'WHATEVER_VALUES'): O =>
    overrides === 'WHATEVER_VALUES'
      ? getDefaults()
      : mergeWith({}, getDefaults(), overrides, mergeCustomizer);

export const bulk = <T extends object>(
  someBuilder: ReturnType<typeof builder<T>>,
  ...someBuilderArguments: Parameters<ReturnType<typeof builder<T>>>
) => ({
  times: (count: number) => range(0, count).map(() => someBuilder(...someBuilderArguments)),
});
