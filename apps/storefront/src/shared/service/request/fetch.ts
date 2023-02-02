import {
  RequestType,
} from './base'
import {
  getCurrentJwt,
  B3SStorage,
  snackbar,
} from '@/utils'

const originFetch = window.fetch

function b3Fetch(path: string, init: any, type?: string, customMessage = false) {
  return new Promise((resolve, reject) => {
    originFetch(path, init).then((res: Response) => (path.includes('current.jwt') ? res.text() : res.json())).then(async (res) => {
      if (res?.code === 500) {
        const data = res?.data || {}
        const message = data.errMsg || res.message || ''
        reject(message)
        return
      }
      // jwt 15 minutes expected
      if (res?.errors?.length && res.errors[0].message === 'JWT token is expired') {
        try {
          await getCurrentJwt()
          const config = {
            Authorization: `Bearer  ${B3SStorage.get('bc_jwt_token') || ''}`,
          }
          const headers = {
            'content-type': 'application/json',
            ...config,
          }

          const reInit = {
            headers,
            method: 'POST',
            body: init.body,
          }
          const newRes = await b3Fetch(path, reInit, type)
          resolve(newRes)
        } catch (e) {
          console.error(e)
        }
      }
      if (type === RequestType.B2BGraphql) {
        const errors = res?.errors?.length ? res.errors[0] : {}
        const {
          message = '',
          extensions = {},
        } = errors

        if (extensions.code === 40101) {
          window.location.href = '#/login?loginFlag=3&showTip=false'
          snackbar.error(message)
        } else if (message) {
          reject(message)
          if (!customMessage) {
            snackbar.error(message)
          }
        } else {
          resolve(res.data)
        }
      } else {
        resolve(res)
      }
    })
      .catch((err: Error) => {
        reject(err)
      })
  })
}
export {
  b3Fetch,
}
