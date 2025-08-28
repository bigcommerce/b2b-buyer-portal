export const getBlobFileName = (blob: Blob, headers: Headers): string => {
  let filename = '';
  if (blob.type === 'text/html') {
    throw new Error();
  }
  const disposition = headers.get('content-disposition');
  const dispositionParams = disposition?.split(';') ?? [];

  const filenameParam = dispositionParams.find((param) => param.trim().startsWith('filename='));
  if (filenameParam) {
    filename = JSON.parse(filenameParam.split('=')[1]);
  }
  return filename;
};
