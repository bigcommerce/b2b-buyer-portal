import {
  ReactElement,
  ReactNode,
} from 'react'

import InfiniteScroll from 'react-infinite-scroller'

interface Pagination {
  offset: number,
  first: number,
  count: number,
}

interface InfiniteScrollProps {
  onPaginationChange?: (pagination: Pagination)=>void,
  pagination?: Pagination,
  children: ReactNode,
  threshold?: number,
  scrollNode?: HTMLElement,
  loader?: ReactElement,
  isLoading: boolean,
}

export const B3InfiniteScroll = (props: InfiniteScrollProps) => {
  const {
    pagination: {
      offset = 0,
      first = 10,
      count = 20,
    } = {},
    onPaginationChange = () => {},
    children,
    threshold = 250,
    scrollNode,
    loader,
    isLoading,
  } = props

  const handleLoadMore = () => {
    if (!isLoading) {
      onPaginationChange({
        offset: offset + first,
        first,
        count,
      })
    }
  }
  const page = Math.floor((offset / first) + 1)
  const getScrollParent = scrollNode ? () => scrollNode : undefined

  return (
    <div
      style={scrollNode ? {} : {
        overflow: 'auto',
      }}
    >
      <InfiniteScroll
        pageStart={page}
        loadMore={handleLoadMore}
        hasMore={offset + first < count}
        loader={isLoading ? (loader || (
          <div>
            Loading ...
          </div>
        )) : <></>}
        getScrollParent={getScrollParent}
        threshold={threshold}
        initialLoad={false}
        useWindow={false}
      >
        { children }
      </InfiniteScroll>
    </div>
  )
}
