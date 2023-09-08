import { useIntl } from 'react-intl'

type MessageFormatPrimitiveValue = string | number | boolean | null | undefined
export interface B3Lang {
  (id: string, options?: Record<string, MessageFormatPrimitiveValue>): string
}

export const useB3Lang: () => B3Lang = () => {
  const intl = useIntl()
  return (id: string, options = {}) =>
    id
      ? intl.formatMessage(
          {
            id,
            defaultMessage: id,
          },
          options
        )
      : ''
}
