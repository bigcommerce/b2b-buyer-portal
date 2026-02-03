const getFileNameFromResponseHeader = (headers: Headers): string => {
  const disposition = headers.get('content-disposition');
  const dispositionParams = disposition?.split(';') ?? [];

  const filenameParam = dispositionParams.find((param) => param.trim().startsWith('filename='));

  if (filenameParam) {
    return JSON.parse(filenameParam.split('=')[1]);
  }

  return '';
};

const handleBlobDownload = (blob: Blob, filename: string) => {
  const tempLink = document.createElement('a');

  tempLink.style.display = 'none';
  tempLink.href = URL.createObjectURL(blob);
  tempLink.setAttribute('download', filename);
  document.body.appendChild(tempLink);
  tempLink.click();
};

export const handleDownleoadDigitalFile = async (fileUrl: string) => {
  const res = await fetch(fileUrl);
  const blob = await res.blob();

  if (blob.type === 'text/html') {
    throw new Error();
  }

  const filename = getFileNameFromResponseHeader(res.headers);

  handleBlobDownload(blob, filename);
};
