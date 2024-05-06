import { snackbar } from '@/utils';

import { RequestType } from './base';

const originFetch = window.fetch;

const responseResult = (path: string, res: any, resolve: any, init: any) => {
  if (path.includes('current.jwt')) return res.text();

  if (init.method === 'DELETE') {
    resolve();
  }
  return res.json();
};

function b3Fetch(path: string, init: any, type?: string, customMessage = false) {
  return new Promise((resolve, reject) => {
    originFetch(path, init)
      .then((res: Response) => responseResult(path, res, resolve, init))
      .then(async (res) => {
        if (res?.code === 500) {
          const data = res?.data || {};
          const message = data.errMsg || res.message || '';
          reject(message);
          return;
        }
        if (type === RequestType.BCRest && path.includes('api/storefront/carts')) {
          if (res?.detail) {
            reject(res);
          }
        }
        if (type === RequestType.B2BGraphql) {
          const errors = res?.errors?.length ? res.errors[0] : {};
          const { message = '', extensions = {} } = errors;
          if (extensions.code === 40101) {
            window.location.href = '#/login?loginFlag=3&showTip=false';
            snackbar.error(message);
          } else if (message) {
            reject(message);
            if (!customMessage) {
              snackbar.error(message);
            }
          } else {
            resolve(res.data);
          }
        } else {
          resolve(res);
        }
      })
      .catch((err: Error) => {
        reject(err);
      });
  });
}
export default b3Fetch;
