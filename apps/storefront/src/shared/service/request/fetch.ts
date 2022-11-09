import {
  RequestType,
} from './base'
import {
  getCurrentJwt,
  B3SStorage,
} from '@/utils'

const originFetch = window.fetch

function b3Fetch(path: string, init: any, type?: string) {
  return new Promise((resolve, reject) => {
    originFetch(path, init).then((res: Response) => {
      if (path.includes('current.jwt')) {
        return res.text()
      }
      return res.json()
    }).then(async (res) => {
      if (res?.code === 500) {
        reject(res.message)
        return
      }
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
        if (res?.errors && res?.errors.length) {
          reject(res.errors[0])
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
