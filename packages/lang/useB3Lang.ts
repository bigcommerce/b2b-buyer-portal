import { useIntl } from 'react-intl'

export const useB3Lang = () => {
  const intl = useIntl()
  return (id: string, options = {
  }) => (
    id ? intl.formatMessage({
      id,
      defaultMessage: id,
    }, options) : '')
}
