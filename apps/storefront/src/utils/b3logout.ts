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

export default {}
