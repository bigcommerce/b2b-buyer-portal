import { useSelector } from 'react-redux'

import { globalStateSelector } from '../store'

const useBlockPendingAccountViewPrice = () => {
  const { blockPendingAccountViewPrice } = useSelector(globalStateSelector)

  return [blockPendingAccountViewPrice]
}

export default useBlockPendingAccountViewPrice
