import { IntlShape, useIntl } from 'react-intl';

type FormatMessageParameters = Parameters<IntlShape['formatMessage']>;

export type LangFormatFunction = (id: string, options?: FormatMessageParameters[1]) => string;

export const useB3Lang: () => LangFormatFunction = () => {
  const intl = useIntl();

  return (id, options) =>
    id
      ? (intl.formatMessage(
          {
            id,
            defaultMessage: id,
          },
          options,
        ) as string)
      : '';
};
