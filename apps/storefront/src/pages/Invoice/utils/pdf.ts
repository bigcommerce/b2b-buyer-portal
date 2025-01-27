import { invoiceDownloadPDF } from '@/shared/service/b2b';

const analyzePDFUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.blob())
      .then((response) => {
        const blob = new Blob([response], { type: 'application/pdf' });

        const invoicePDFUrl = window.URL.createObjectURL(blob);

        resolve(invoicePDFUrl);
      })
      .catch((e) => {
        reject(e);
      });
  });

export const getInvoiceDownloadPDFUrl = async (invoiceId: string, isPayNow = false) => {
  const {
    invoicePdf: { url },
  } = await invoiceDownloadPDF(Number(invoiceId), isPayNow);

  return url;
};

export const handlePrintPDF = async (invoiceId: string, isPayNow = false): Promise<string> => {
  let url = '';
  try {
    url = await getInvoiceDownloadPDFUrl(invoiceId, isPayNow);
    const pdfUrl = await analyzePDFUrl(url);

    return pdfUrl;
  } catch (error) {
    return url;
  }
};

export default handlePrintPDF;
