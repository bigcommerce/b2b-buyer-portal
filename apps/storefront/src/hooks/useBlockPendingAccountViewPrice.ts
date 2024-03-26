import { useAppSelector } from '@/store'

const useBlockPendingAccountViewPrice = () => {
  const blockPendingAccountViewPrice = useAppSelector(
    ({ global }) => global.blockPendingAccountViewPrice
  )

  return [blockPendingAccountViewPrice]
}

export default useBlockPendingAccountViewPrice
