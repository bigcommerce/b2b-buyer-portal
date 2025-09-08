import { useAppSelector } from '@/store';

export const useFeatureFlags = () => {
  const featureFlags = useAppSelector(({ global }) => global.featureFlags);

  return featureFlags;
};
