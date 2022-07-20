const storeHash = (window as any).b3?.setting?.storeHash || import.meta.env.VITE_B2B_STOREHASH

const getBcBaseUrl = () => {
  let baseUrl = ''
  if (import.meta.env.VITE_NODE_ENV === 'development') {
    baseUrl = '/bigcommerce'
  } else {
    baseUrl = ''
  }

  return baseUrl
}
const bcBaseUrl = getBcBaseUrl()

export {
  storeHash,
  bcBaseUrl,
}
