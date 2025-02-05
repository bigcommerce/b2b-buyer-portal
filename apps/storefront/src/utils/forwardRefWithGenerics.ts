import { forwardRef } from 'react';

// does not modify the behavior of forwardRef in any way
// simply adds type information to the function signature
// preserving any generics passed to the original forwardRef function
export const forwardRefWithGenerics = forwardRef as <T, P = NonNullable<unknown>>(
  render: (props: P, ref: React.ForwardedRef<T>) => ReturnType<React.FunctionComponent>,
) => (
  props: React.PropsWithoutRef<P> & React.RefAttributes<T>,
) => ReturnType<React.FunctionComponent>;
