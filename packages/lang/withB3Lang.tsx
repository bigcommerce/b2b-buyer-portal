import React from 'react'
import { useB3Lang } from './useB3Lang'

export const withB3Lang = (WrappedComponent: typeof React.Component) => function (props: any) {
  const b3lang = useB3Lang()

  return (
    <WrappedComponent
      b3lang={b3lang}
      {...props}
    />
  )
}
