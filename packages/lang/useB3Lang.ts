import { useCallback } from 'react';
import { useIntl } from 'react-intl';

export type LangFormatFunction = (
  id: string,
  values?: Record<string, string | number | Date>,
) => string;

export const useB3Lang: () => LangFormatFunction = () => {
  const intl = useIntl();

  return useCallback(
    (id, values) => {
      if (!id) {
        return '';
      }

      return intl.formatMessage({ id, defaultMessage: id }, values);
    },
    [intl],
  );
};
