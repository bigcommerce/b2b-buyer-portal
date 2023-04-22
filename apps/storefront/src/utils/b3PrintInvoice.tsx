const bindDom = (html: string, domId: string) => {
  let iframeDom = document.getElementById(domId) as HTMLIFrameElement | null
  if (!iframeDom) {
    iframeDom = document.createElement('iframe')
    iframeDom.src = 'about:blank'
    iframeDom.id = domId
    iframeDom.style.display = 'none'
    document.body.appendChild(iframeDom)
  }
  const iframeDoc = iframeDom.contentWindow?.document
  if (iframeDoc) {
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()
  }
  iframeDom.style.display = 'block'
}

const b2bPrintInvoice = async (orderId: string, domId: string) => {
  await fetch(`/account.php?action=print_invoice&order_id=${orderId}`)
    .then((response: Response) => {
      if (response.ok) {
        return response.text()
      }
      throw new Error('Network response was not ok.')
    })
    .then((html: string) => {
      bindDom(html, domId)
    })
    .catch((error: Error) => {
      console.error('Error Invoice:', error)
    })
}
export default b2bPrintInvoice
