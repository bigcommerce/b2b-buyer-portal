import { B3SStorage } from './b3Storage'

export const logoutSession = () => {
  B3SStorage.delete('B3UserId')
  B3SStorage.delete('companyStatus')
  B3SStorage.delete('B3Role')
  B3SStorage.delete('B3CustomerInfo')
  B3SStorage.delete('realRole')
  B3SStorage.delete('B3CustomerInfo')
  B3SStorage.delete('B3CustomerId')
  B3SStorage.delete('nextPath')
  B3SStorage.delete('B3EmailAddress')
}

export const isB2bTokenPage = () => {
  const { hash = '' } = window.location

  if (!hash.includes('#/')) {
    return false
  }

  const noB2bTokenPages = ['quoteDraft', 'quoteDetail', 'register']

  return !noB2bTokenPages.some((item: string) => hash.includes(item))
}

export default {}
