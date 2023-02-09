import {
  useState,
  useContext,
  useEffect,
} from 'react'

import {
  useParams,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import copy from 'copy-to-clipboard'

import {
  Box,
  Grid,
  Button,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  getB2BQuoteDetail,
  getBcQuoteDetail,
  exportB2BQuotePdf,
  exportBcQuotePdf,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  snackbar,
  getSearchVal,
} from '@/utils'

import QuoteDetailHeader from './components/QuoteDetailHeader'
import QuoteInfo from './components/QuoteInfo'
import QuoteDetailFooter from './components/QuoteDetailFooter'
import QuoteDetailTable from './components/QuoteDetailTable'
import {
  QuoteDetailSummary,
} from './components/QuoteDetailSummary'
import {
  QuoteAttachment,
} from './components/QuoteAttachment'
import {
  QuoteNote,
} from './components/QuoteNote'

import Message from './components/Message'

const QuoteDetail = () => {
  const {
    id = '',
  } = useParams()
  const navigate = useNavigate()

  const {
    state: {
      role,
      customer,
      isB2BUser,
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

  const location = useLocation()

  const getQuoteDetail = async () => {
    setIsRequestLoading(true)

    try {
      const {
        search,
      } = location

      const date = getSearchVal(search, 'date') || ''
      const data = {
        id: +id,
        date: date.toString(),
      }

      const fn = +role === 99 ? getBcQuoteDetail : getB2BQuoteDetail

      const {
        quote,
      } = await fn(data)

      setQuoteDetail(quote)
      setQuoteSummary({
        originalSubtotal: quote.subtotal,
        discount: quote.discount,
        tax: quote.taxTotal,
        shipping: quote.shippingTotal,
        grandTotal: quote.totalAmount,
      })
      setCurrency(quote.currency)
      setProductList(quote.productsList)

      const {
        backendAttachFiles = [],
        storefrontAttachFiles = [],
      } = quote

      const newFileList: CustomFieldItems[] = []
      storefrontAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.fileUrl,
          title: 'Uploaded by customer: xxxx', // TODO
        })
      })

      backendAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.fileUrl,
          title: 'Uploaded by sales rep: xxxx', // TODO
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

  const exportPdf = async () => {
    setIsRequestLoading(true)
    const {
      id,
      currency: {
        currencyExchangeRate,
        token,
      },
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
        window.open(`${quotePdf.quotePdfExport.url}`, '_blank')
      }
    } catch (err: any) {
      snackbar.error(err)
    } finally {
      setIsRequestLoading(false)
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
        {
          +role === 100 ? 'Your quote was submitted. You can always find the quote using this link.' : 'Your quote was submitted'
        }
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
        {
          +role === 100 ? 'Copy quote link' : 'Review all quotes'
        }
      </Button>
    </Box>
  )

  useEffect(() => {
    const {
      state,
    } = location

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
    <B3Sping
      isSpinning={isRequestLoading}
    >
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
            sx={isMobile ? {
              flexBasis: '100%',
              pl: '16px',
            } : {
              flexBasis: '690px',
              flexGrow: 1,
              ml: '16px',
              pt: '16px',
            }}
          >
            <Grid
              item
              sx={isMobile ? {
                flexBasis: '100%',
              } : {
                flexBasis: '690px',
                flexGrow: 1,
              }}
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
            sx={isMobile ? {
              flexBasis: '100%',
            } : {
              flexBasis: '340px',
            }}
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

            <Box
              sx={{
                marginBottom: '1rem',
                displayPrint: 'none',
              }}
            >
              <Message
                id={id}
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
              <QuoteNote />
            </Box>

            <Box
              sx={{
                displayPrint: 'none',
              }}
            >
              {
                fileList.length > 0 && (
                <QuoteAttachment
                  allowUpload={false}
                  defaultFileList={fileList}
                />
                )
              }
            </Box>
          </Grid>
        </Grid>

        {
          (+role !== 2 && +quoteDetail.status !== 4) && (
            <QuoteDetailFooter
              quoteId={quoteDetail.id}
              quoteDate={quoteDetail?.createdAt?.toString()}
              role={role}
            />
          )
        }
      </Box>
    </B3Sping>
  )
}

export default QuoteDetail
