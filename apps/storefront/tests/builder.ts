import { mergeWith, range } from 'lodash-es';

// Arrays are excluded from the DeepPartialObjects type because they are not merged
// including can result in the accidental creation of partial objects within arrays
type DeepPartialObjects<T> = unknown extends T
  ? T
  : T extends object
    ? {
        [P in keyof T]?: T[P] extends Array<infer U>
          ? Array<U>
          : T[P] extends ReadonlyArray<infer U>
            ? ReadonlyArray<U>
            : DeepPartialObjects<T[P]>;
      }
    : T;

const mergeCustomizer = <T>(objValue: T, srcValue: T) =>
  // Replace, rather than merge, arrays for more predictable results
  Array.isArray(objValue) ? srcValue : undefined;

type NonArray<T> = T extends unknown[] ? never : T;

export const builder =
  <T extends object>(getDefaults: () => NonArray<T>) =>
  (overrides: DeepPartialObjects<T> | 'WHATEVER_VALUES'): T =>
    overrides === 'WHATEVER_VALUES'
      ? getDefaults()
      : mergeWith({}, getDefaults(), overrides, mergeCustomizer);

export const bulk = <T extends object>(
  someBuilder: ReturnType<typeof builder<T>>,
  ...someBuilderArguments: Parameters<ReturnType<typeof builder<T>>>
) => ({
  times: (count: number) => range(0, count).map(() => someBuilder(...someBuilderArguments)),
});
