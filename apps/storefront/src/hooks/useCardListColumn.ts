import { useEffect, useState } from 'react';

import useWindowSize from './useWindowSize';

const useCardListColumn = () => {
  const { width } = useWindowSize();

  const [isExtraLarge, setExtraLarge] = useState<boolean>(false);

  useEffect(() => {
    if (Number(width) >= 1536) {
      setExtraLarge(true);
    } else {
      setExtraLarge(false);
    }
  }, [width]);

  return isExtraLarge;
};

export { useCardListColumn };
