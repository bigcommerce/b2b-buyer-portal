import { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Grid } from '@mui/material'
import copy from 'copy-to-clipboard'

import { B3Sping } from '@/components'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  exportB2BQuotePdf,
  exportBcQuotePdf,
  getB2BQuoteDetail,
  getBcQuoteDetail,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'
import { getDefaultCurrencyInfo, getSearchVal, snackbar } from '@/utils'
import { conversionProductsList } from '@/utils/b3Product/shared/config'

import Message from './components/Message'
import QuoteAttachment from './components/QuoteAttachment'
import QuoteDetailFooter from './components/QuoteDetailFooter'
import QuoteDetailHeader from './components/QuoteDetailHeader'
import QuoteDetailSummary from './components/QuoteDetailSummary'
import QuoteDetailTable from './components/QuoteDetailTable'
import QuoteInfo from './components/QuoteInfo'
import QuoteNote from './components/QuoteNote'
import QuoteTermsAndConditions from './components/QuoteTermsAndConditions'
import { ProductInfoProps } from './shared/config'

function QuoteDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const {
    state: {
      companyInfo: { id: companyInfoId },
      role,
      customer,
      isB2BUser,
      isAgenting,
    },
  } = useContext(GlobaledContext)
  const [isMobile] = useMobile()

  const [quoteDetail, setQuoteDetail] = useState<any>({})
  const [productList, setProductList] = useState<any>([])
  const [currency, setCurrency] = useState<any>({})
  const [fileList, setFileList] = useState<any>([])

  const [quoteSummary, setQuoteSummary] = useState<any>({
    originalSubtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    grandTotal: 0,
  })
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const { currency_code: currencyCode } = getDefaultCurrencyInfo()

  const location = useLocation()

  const handleGetProductsById = async (listProducts: ProductInfoProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = []

      listProducts.forEach((item) => {
        if (!productIds.includes(item.productId)) {
          productIds.push(item.productId)
        }
      })
      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      try {
        const { productsSearch } = await getProducts({
          productIds,
          currencyCode,
          companyId: companyInfoId,
        })

        const newProductsSearch = conversionProductsList(productsSearch)

        listProducts.forEach((item) => {
          const productInfo = newProductsSearch.find(
            (search: CustomFieldItems) => {
              const { id: productId } = search

              return +item.productId === +productId
            }
          )

          item.productsSearch = productInfo || {}
        })

        return listProducts
      } catch (err: any) {
        snackbar.error(err)
      }
    }
    return undefined
  }

  const getQuoteDetail = async () => {
    setIsRequestLoading(true)

    try {
      const { search } = location

      const date = getSearchVal(search, 'date') || ''
      const data = {
        id: +id,
        date: date.toString(),
      }

      const fn = +role === 99 ? getBcQuoteDetail : getB2BQuoteDetail

      const { quote } = await fn(data)
      const productsWithMoreInfo = await handleGetProductsById(
        quote.productsList
      )

      setQuoteDetail(quote)
      setQuoteSummary({
        originalSubtotal: quote.subtotal,
        discount: quote.discount,
        tax: quote.taxTotal,
        shipping: quote.shippingTotal,
        grandTotal: quote.totalAmount,
      })
      setCurrency(quote.currency)
      setProductList(productsWithMoreInfo)

      const { backendAttachFiles = [], storefrontAttachFiles = [] } = quote

      const newFileList: CustomFieldItems[] = []
      storefrontAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.id,
          hasDelete: quoteDetail.status !== 4,
          title: `Uploaded by customer: ${file.createdBy}`,
        })
      })

      backendAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.id,
          title: `Uploaded by sales rep: ${file.createdBy}`,
        })
      })

      setFileList(newFileList)

      return quote
    } catch (err: any) {
      snackbar.error(err)
      throw err
    } finally {
      setIsRequestLoading(false)
    }
  }

  const fetchPdfUrl = async () => {
    setIsRequestLoading(true)
    const {
      id,
      currency: { currencyExchangeRate, token },
    } = quoteDetail
    try {
      const data = {
        quoteId: +id,
        currency: {
          currencyExchangeRate,
          token,
        },
      }

      const fn = +role === 99 ? exportBcQuotePdf : exportB2BQuotePdf

      const quotePdf = await fn(data)

      if (quotePdf) {
        return quotePdf.quotePdfExport.url
      }
    } catch (err: any) {
      snackbar.error(err)
    }
    return undefined
  }

  const exportPdf = async () => {
    try {
      const quotePdfUrl = await fetchPdfUrl()
      if (quotePdfUrl) {
        window.open(`${quotePdfUrl}`, '_blank')
      }
    } catch (err: any) {
      snackbar.error(err)
    } finally {
      setIsRequestLoading(false)
    }
  }

  const printQuote = async () => {
    try {
      const quotePdfUrl = await fetchPdfUrl()

      if (quotePdfUrl) {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', quotePdfUrl, true)
        xhr.responseType = 'arraybuffer'
        xhr.onload = () => {
          if (xhr.status === 200) {
            const pdfData = new Uint8Array(xhr.response)
            const pdfBlob = new Blob([pdfData], {
              type: 'application/pdf',
            })
            const pdfUrl = URL.createObjectURL(pdfBlob)
            const iframe = document.createElement('iframe')
            iframe.setAttribute('src', pdfUrl)
            iframe.setAttribute('style', 'display:none;')
            document.getElementById('bundle-container')?.appendChild(iframe)
            setIsRequestLoading(false)
            iframe?.contentWindow?.print()
          }
        }

        xhr.send()
      }
    } catch (err: any) {
      snackbar.error(err)
    }
  }

  const getQuoteTableDetails = async (params: any) => {
    let allProductsList: any[] = productList

    if (allProductsList.length === 0) {
      const quote = await getQuoteDetail()
      allProductsList = quote?.productsList || []
    }

    const startIndex = +params.offset
    const endIndex = +params.first + startIndex

    if (!allProductsList.length) {
      return {
        edges: [],
        totalCount: 0,
      }
    }
    const list = allProductsList.slice(startIndex, endIndex)

    return {
      edges: list,
      totalCount: allProductsList.length,
    }
  }

  const tip = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          mr: '15px',
        }}
      >
        {+role === 100
          ? 'Your quote was submitted. You can always find the quote using this link.'
          : 'Your quote was submitted'}
      </Box>
      <Button
        onClick={() => {
          if (+role === 100) {
            copy(window.location.href)
            snackbar.success('copy successfully')
          } else {
            navigate('/quotes')
          }
        }}
        variant="text"
        sx={{
          color: '#ffffff',
        }}
      >
        {+role === 100 ? 'Copy quote link' : 'Review all quotes'}
      </Button>
    </Box>
  )

  useEffect(() => {
    const { state } = location

    if (state) {
      setTimeout(() => {
        snackbar.success('', {
          jsx: () => tip(),
          isClose: true,
          duration: 30000,
        })
      }, 10)
      location.state = null
    }
  }, [])

  return (
    <B3Sping isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <QuoteDetailHeader
          status={quoteDetail.status}
          quoteNumber={quoteDetail.quoteNumber}
          issuedAt={quoteDetail.createdAt}
          expirationDate={quoteDetail.expiredAt}
          exportPdf={exportPdf}
          printQuote={printQuote}
          role={role}
        />

        <Box
          sx={{
            marginTop: '1rem',
          }}
        >
          <QuoteInfo
            contactInfo={quoteDetail.contactInfo}
            shippingAddress={quoteDetail.shippingAddress}
            billingAddress={quoteDetail.billingAddress}
          />
        </Box>

        <Grid
          container
          spacing={2}
          sx={{
            marginTop: '0',
            overflow: 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingBottom: '20px',
            marginBottom: isMobile ? '6rem' : 0,
            '@media print': {
              overflow: 'hidden',
            },
          }}
        >
          <Box
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                    pl: '16px',
                  }
                : {
                    flexBasis: '690px',
                    flexGrow: 1,
                    ml: '16px',
                    pt: '16px',
                  }
            }
          >
            <Grid
              item
              sx={
                isMobile
                  ? {
                      flexBasis: '100%',
                    }
                  : {
                      flexBasis: '690px',
                      flexGrow: 1,
                    }
              }
            >
              <QuoteDetailTable
                currencyToken={currency?.token}
                total={productList.length}
                getQuoteTableDetails={getQuoteTableDetails}
              />
            </Grid>
          </Box>

          <Grid
            item
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                  }
                : {
                    flexBasis: '340px',
                  }
            }
          >
            <Box
              sx={{
                marginBottom: '1rem',
              }}
            >
              <QuoteDetailSummary
                quoteSummary={quoteSummary}
                currency={quoteDetail.currency}
              />
            </Box>

            {quoteDetail.notes && (
              <Box
                sx={{
                  marginBottom: '1rem',
                  displayPrint: 'none',
                }}
              >
                <QuoteNote quoteNotes={quoteDetail.notes} />
              </Box>
            )}

            {quoteDetail.notes && (
              <Box
                sx={{
                  marginBottom: '1rem',
                  displayPrint: 'none',
                }}
              >
                <QuoteNote quoteNotes={quoteDetail.notes} />
              </Box>
            )}

            <Box
              sx={{
                marginBottom: '1rem',
                displayPrint: 'none',
              }}
            >
              <Message
                id={id}
                status={quoteDetail.status}
                isB2BUser={isB2BUser}
                email={customer?.emailAddress || ''}
                msgs={quoteDetail?.trackingHistory || []}
              />
            </Box>

            <Box
              sx={{
                marginBottom: '1rem',
                displayPrint: 'none',
              }}
            >
              <QuoteAttachment
                allowUpload={+quoteDetail.status !== 4}
                quoteId={quoteDetail.id}
                status={quoteDetail.status}
                defaultFileList={fileList}
              />
            </Box>

            {quoteDetail.legalTerms && (
              <Box
                sx={{
                  displayPrint: 'none',
                }}
              >
                <QuoteTermsAndConditions
                  quoteLegalTerms={quoteDetail.legalTerms}
                />
              </Box>
            )}
          </Grid>
        </Grid>

        {+role !== 2 && +quoteDetail.status !== 4 && (
          <QuoteDetailFooter
            quoteId={quoteDetail.id}
            role={role}
            isAgenting={isAgenting}
            status={quoteDetail.status}
          />
        )}
      </Box>
    </B3Sping>
  )
}

export default QuoteDetail
