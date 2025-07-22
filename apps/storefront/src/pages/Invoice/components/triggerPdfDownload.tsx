export function triggerPdfDownload(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = fileName;
  a.click();
}
