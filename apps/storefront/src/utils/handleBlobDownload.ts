export const handleBlobDownload = async (blob: Blob, filename: string) => {
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = URL.createObjectURL(blob);
  if (filename !== '') {
    tempLink.setAttribute('download', filename);
    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank');
    }
  } else {
    tempLink.setAttribute('target', '_blank');
  }
  document.body.appendChild(tempLink);
  tempLink.click();
};
