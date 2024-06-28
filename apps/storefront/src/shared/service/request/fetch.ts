const responseResult = (res: Response, resolve: (val?: unknown) => void, init: RequestInit) => {
  if (init.method === 'DELETE') {
    resolve();
  }
  return res.json();
};

function b3Fetch(path: string, init: RequestInit): any {
  return new Promise((resolve, reject) => {
    fetch(path, init)
      .then((res: Response) => responseResult(res, resolve, init))
      .then(async (res) => {
        if (res?.code === 500) {
          const data = res?.data || {};
          const message = data.errMsg || res.message || '';
          reject(message);
          return;
        }

        resolve(res);
      })
      .catch((err: Error) => {
        reject(err);
      });
  });
}
export default b3Fetch;
