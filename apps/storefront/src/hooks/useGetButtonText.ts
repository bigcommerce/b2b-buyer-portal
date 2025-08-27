import { useB3Lang } from '@/lib/lang';

const useGetButtonText = (
  translationVariable: string,
  storefrontText: string,
  defaultText: string,
) => {
  const b3Lang = useB3Lang();
  const translatedText = b3Lang(translationVariable);
  if (translatedText === defaultText) {
    return storefrontText || defaultText;
  }

  return translatedText;
};

export default useGetButtonText;
