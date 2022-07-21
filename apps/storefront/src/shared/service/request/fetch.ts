import { RequestType } from './base'

// Defines a collection of functions used to store processing and error result processing for intercepting request and response results
const interceptorsReq: Array<any> = []
const interceptorsReqError: Array<any> = []
const interceptorsRes: Array<any> = []
const interceptorsResError: Array<any> = []

const originFetch = window.fetch

function b3Fetch(path: string, init: any, type?: string) {
  interceptorsReq.forEach((item) => {
    init = item(init)
  })

  return new Promise((resolve, reject) => {
    originFetch(path, init).then((res: Response) => res.json()).then((res) => {
      if (res?.code === 500) {
        reject(res.message)
        return
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
        interceptorsResError.forEach((item): void => {
          err = item(err)
        })
        reject(err)
      })
  })
}

const interceptors = {
  request: {
    use<T, Y>(callback: T, errorCallback?: Y): void {
      interceptorsReq.push(callback)
      if (errorCallback) interceptorsReqError.push(errorCallback)
    },
  },
  response: {
    use<T, Y>(callback: T, errorCallback?: Y): void {
      interceptorsRes.push(callback)
      if (errorCallback)interceptorsResError.push(errorCallback)
    },
  },
}

export {
  b3Fetch,
  interceptors,
}
