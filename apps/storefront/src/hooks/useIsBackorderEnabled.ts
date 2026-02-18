import { useAppSelector } from '@/store';

export const useIsBackorderEnabled = (): boolean => {
  return useAppSelector(({ global }) => global.backorderEnabled);
};
