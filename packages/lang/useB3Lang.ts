import { useIntl } from 'react-intl'

export interface B3Lang {
  (id: string, options?: {}): string
}

export const useB3Lang = () => {
  const intl = useIntl()
  return (id: string, options = {
  }) => (
    id ? intl.formatMessage({
      id,
      defaultMessage: id,
    }, options) : '')
}
