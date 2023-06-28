import { useEffect, useRef, useState } from 'react'
import PDFObject from 'pdfobject'

import { B3Sping } from '@/components'

import { handlePrintPDF } from '../utils/pdf'

interface RowList {
  [key: string]: CustomFieldItems | string | number
  id: string
  createdAt: number
  updatedAt: number
}

interface PrintTempalteProps {
  row: RowList
}

function PrintTempalte({ row }: PrintTempalteProps) {
  const container = useRef<HTMLInputElement | null>(null)

  const [loadding, setLoadding] = useState<boolean>(false)
  const viewPrint = async () => {
    setLoadding(true)
    const { id: invoiceId } = row

    const invoicePDFUrl = await handlePrintPDF(invoiceId)

    if (!invoicePDFUrl) {
      // TODO: error
      console.error('pdf url resolution error')
      return
    }

    PDFObject.embed(invoicePDFUrl, container.current)

    setLoadding(false)
  }

  useEffect(() => {
    viewPrint()
  }, [row])

  return (
    <B3Sping isSpinning={loadding}>
      <div ref={container} style={{ height: '400px', width: '100%' }} />
    </B3Sping>
  )
}

export default PrintTempalte
