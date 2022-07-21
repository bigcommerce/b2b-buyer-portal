import {
  useIntl,
} from 'react-intl'

export interface B3Lang {
  (id: string, options?: Record<string, string | Number>): string
}

export const useB3Lang = () => {
  const intl = useIntl()
  return (id: string, options = {}) => (
    id ? intl.formatMessage({
      id,
      defaultMessage: id,
    }, options) : '')
}
