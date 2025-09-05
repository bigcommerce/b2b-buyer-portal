export const getFileNameFromResponseHeader = (headers: Headers): string => {
  let filename = '';
  const disposition = headers.get('content-disposition');
  const dispositionParams = disposition?.split(';') ?? [];

  const filenameParam = dispositionParams.find((param) => param.trim().startsWith('filename='));
  if (filenameParam) {
    filename = JSON.parse(filenameParam.split('=')[1]);
  }
  return filename;
};
