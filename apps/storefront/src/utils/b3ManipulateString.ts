import { RegisterFields } from '@/pages/Registered/types';

const manipulateString = (input: string): string => {
  if (!input) return '';
  const words = input.split(' ');

  if (words.length === 0) {
    return input;
  }

  const firstWord = words[0];
  const manipulatedWords = words
    .slice(1)
    .map((word) => word.charAt(0).toLowerCase() + word.slice(1));

  return [firstWord, ...manipulatedWords].join(' ');
};

const convertLabel = (infos: RegisterFields[]) =>
  infos.map((info: RegisterFields) => {
    const node = info;
    const { label } = node;
    if (label) {
      node.label = manipulateString(label);
    }

    return info;
  }) || [];

export { convertLabel, manipulateString };
