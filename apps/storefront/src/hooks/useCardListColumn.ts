import { useEffect, useState } from 'react';
import { useWindowSize } from '@b3/hooks';

const useCardListColumn = () => {
  const { width } = useWindowSize();

  const [isExtraLarge, setExtraLarge] = useState<boolean>(false);

  useEffect(() => {
    if (+width >= 1536) {
      setExtraLarge(true);
    } else {
      setExtraLarge(false);
    }
  }, [width]);

  return isExtraLarge;
};

export default useCardListColumn;
