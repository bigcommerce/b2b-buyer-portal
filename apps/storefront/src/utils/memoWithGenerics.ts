import { memo } from 'react';

// does not modify the behavior of memo in any way
// simply adds type information to the function signature
// preserving any generics passed to the original memo function
export const memoWithGenerics = memo as <P extends object>(
  Component: (props: P) => ReturnType<React.FunctionComponent>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
) => (props: P) => ReturnType<React.FunctionComponent>;
