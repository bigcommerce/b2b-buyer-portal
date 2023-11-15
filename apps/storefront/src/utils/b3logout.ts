import { customerExists } from '@/shared/service/bc'

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

export const isB2bTokenPage = (gotoUrl?: string) => {

  const noB2bTokenPages = ['quoteDraft', 'quoteDetail', 'register', 'login']

  if (gotoUrl) {
    return !noB2bTokenPages.some((item: string) => gotoUrl.includes(item))
  } 

  const { hash = '' } = window.location

  if (!hash.includes('#/')) {
    return false
  }

  return !noB2bTokenPages.some((item: string) => hash.includes(item))
}

export const isUserGotoLogin = async (gotoUrl: string) => {
  const isB2bPage = isB2bTokenPage(gotoUrl)
  let isGotoLogin = false
  try {
    const {
      data: {
        customer
      }
    } = await customerExists()

    if (!customer && isB2bPage) {
      logoutSession()
      isGotoLogin = true
    }
  } catch (err: unknown) {
    console.log(err)
  }

  return isGotoLogin
}

export default {}
