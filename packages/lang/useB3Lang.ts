import { useIntl } from 'react-intl';

export type LangFormatFunction = (
  id: string,
  // TODO: If we pass `undefined | null`, the translation will probably be not correct.
  // Ensure code using the values parameter do not pass `undefined | null`.
  values?: Record<string, string | number | Date | undefined | null>,
) => string;

export const useB3Lang: () => LangFormatFunction = () => {
  const intl = useIntl();

  return (id, values) => {
    if (!id) {
      return '';
    }

    return intl.formatMessage(
      {
        id,
        defaultMessage: id,
      },
      values,
    );
  };
};
