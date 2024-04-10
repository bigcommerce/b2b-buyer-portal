import { useCallback, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
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
import {
  defaultCurrencyCodeSelector,
  TaxZoneRates,
  useAppSelector,
} from '@/store'
import { Currency } from '@/types'
import { getSearchVal, getVariantInfoOOSAndPurchase, snackbar } from '@/utils'
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
    state: { isB2BUser, bcLanguage },
  } = useContext(GlobaledContext)
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id)
  const emailAddress = useAppSelector(
    ({ company }) => company.customer.emailAddress
  )
  const customerGroupId = useAppSelector(
    ({ company }) => company.customer.customerGroupId
  )
  const role = useAppSelector(({ company }) => company.customer.role)
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.isAgenting)
  const [isMobile] = useMobile()

  const b3Lang = useB3Lang()

  const [quoteDetail, setQuoteDetail] = useState<any>({})
  const [productList, setProductList] = useState<any>([])
  const [fileList, setFileList] = useState<any>([])
  const [isHandleApprove, setHandleApprove] = useState<boolean>(false)

  const [isHideQuoteCheckout, setIsHideQuoteCheckout] = useState<boolean>(false)

  const [quoteSummary, setQuoteSummary] = useState<any>({
    originalSubtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    totalAmount: 0,
  })
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [isShowFooter, setIsShowFooter] = useState(false)
  const [quoteDetailTax, setQuoteDetailTax] = useState(0)
  const [noBuyerProductName, setNoBuyerProductName] = useState({
    oos: '',
    nonPurchasable: '',
  })

  const location = useLocation()
  const currency = useAppSelector(defaultCurrencyCodeSelector)
  const taxZoneRates = useAppSelector(({ global }) => global.taxZoneRates)
  const enteredInclusiveTax = useAppSelector(
    ({ global }) => global.enteredInclusive
  )
  const isEnableProduct = useAppSelector(
    ({ global }) => global.blockPendingQuoteNonPurchasableOOS?.isEnableProduct
  )

  useEffect(() => {
    let oosErrorList = ''
    let nonPurchasableErrorList = ''

    productList.forEach((item: CustomFieldItems) => {
      const buyerInfo = getVariantInfoOOSAndPurchase(item)

      if (buyerInfo?.type && isEnableProduct && !item?.purchaseHandled) {
        if (buyerInfo.type === 'oos') {
          oosErrorList += `${item.productName}${oosErrorList ? ',' : ''}`
        }

        if (buyerInfo.type === 'non-purchasable') {
          nonPurchasableErrorList += `${item.productName}${
            nonPurchasableErrorList ? ',' : ''
          }`
        }
      }
    })

    const isHideCheckout = !!oosErrorList || !!nonPurchasableErrorList
    if (isEnableProduct && isHandleApprove && isHideCheckout) {
      if (oosErrorList)
        snackbar.error(
          b3Lang('quoteDetail.message.insufficientStock', {
            ProductName: oosErrorList,
          })
        )

      if (nonPurchasableErrorList)
        snackbar.error(
          b3Lang('quoteDetail.message.nonPurchasable', {
            ProductName: nonPurchasableErrorList,
          })
        )
    }

    setIsHideQuoteCheckout(isHideCheckout)

    setNoBuyerProductName({
      oos: oosErrorList,
      nonPurchasable: nonPurchasableErrorList,
    })
    // disabling since b3Lang is a dependency that will trigger rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnableProduct, isHandleApprove, productList])

  const proceedingCheckoutFn = useCallback(() => {
    if (isHideQuoteCheckout) {
      const { oos, nonPurchasable } = noBuyerProductName
      if (oos)
        snackbar.error(
          b3Lang('quoteDetail.message.insufficientStock', {
            ProductName: oos,
          })
        )

      if (nonPurchasable)
        snackbar.error(
          b3Lang('quoteDetail.message.nonPurchasable', {
            ProductName: nonPurchasable,
          })
        )
    }
    return isHideQuoteCheckout
    // disabling as b3Lang is a dependency that will trigger rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHideQuoteCheckout, noBuyerProductName])

  const classRates: TaxZoneRates[] = []
  if (taxZoneRates?.length) {
    const defaultTaxZone = taxZoneRates?.find(
      (taxZone: { id: number }) => taxZone.id === 1
    )
    if (defaultTaxZone) {
      const { rates = [] } = defaultTaxZone
      if (rates.length && rates[0].enabled && rates[0].classRates.length) {
        rates[0].classRates.forEach((rate) => classRates.push(rate))
      }
    }
  }

  const getTaxRate = (taxClassId: number, variants: any) => {
    if (variants.length) {
      const {
        bc_calculated_price: {
          tax_exclusive: taxExclusive,
          tax_inclusive: taxInclusive,
        },
      } = variants[0]
      return (taxInclusive - taxExclusive) / taxExclusive
    }
    if (classRates.length) {
      return (
        (classRates.find((rate) => rate.taxClassId === taxClassId)?.rate || 0) /
        100
      )
    }
    return 0
  }

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
        const { currency_code: currencyCode } = currency as Currency
        const { productsSearch } = await getProducts({
          productIds,
          currencyCode,
          companyId: companyInfoId,
          customerGroupId,
        })

        const newProductsSearch = conversionProductsList(productsSearch)

        listProducts.forEach((item) => {
          const listProduct = item
          const productInfo = newProductsSearch.find(
            (search: CustomFieldItems) => {
              const { id: productId } = search

              return +item.productId === +productId
            }
          )

          listProduct.productsSearch = productInfo || {}
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
    setIsShowFooter(false)

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
        totalAmount: quote.totalAmount,
      })
      setProductList(productsWithMoreInfo)

      if (+quote.shippingTotal === 0) {
        setQuoteDetailTax(+quote.taxTotal)
      } else {
        let taxPrice = 0
        productsWithMoreInfo?.forEach((product) => {
          const {
            quantity,
            offeredPrice,
            productsSearch: { variants = [], taxClassId },
          } = product

          const taxRate = getTaxRate(taxClassId, variants)
          taxPrice += enteredInclusiveTax
            ? ((+offeredPrice * taxRate) / (1 + taxRate)) * +quantity
            : +offeredPrice * taxRate * +quantity
        })

        setQuoteDetailTax(taxPrice)
      }

      const {
        backendAttachFiles = [],
        storefrontAttachFiles = [],
        salesRep,
        salesRepEmail,
      } = quote

      setHandleApprove(!!salesRep || !!salesRepEmail)

      const newFileList: CustomFieldItems[] = []
      storefrontAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.id,
          hasDelete: quoteDetail.status !== 4,
          title: b3Lang('quoteDetail.uploadedByCustomer', {
            createdBy: file.createdBy,
          }),
        })
      })

      backendAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.id,
          title: b3Lang('quoteDetail.uploadedBySalesRep', {
            createdBy: file.createdBy,
          }),
        })
      })

      setFileList(newFileList)

      return quote
    } catch (err: any) {
      snackbar.error(err)
      throw err
    } finally {
      setIsRequestLoading(false)
      setIsShowFooter(true)
    }
  }

  const fetchPdfUrl = async (bool: boolean) => {
    setIsRequestLoading(true)
    const { id, createdAt } = quoteDetail
    try {
      const data = {
        quoteId: +id,
        createdAt,
        isPreview: bool,
        lang: bcLanguage,
      }

      const fn = +role === 99 ? exportBcQuotePdf : exportB2BQuotePdf

      const quotePdf = await fn(data)

      if (quotePdf) {
        return {
          url: quotePdf.quoteFrontendPdf.url,
          content: quotePdf.quoteFrontendPdf.content,
        }
      }
    } catch (err: any) {
      snackbar.error(err)
    }
    return {
      url: '',
      content: '',
    }
  }

  const exportPdf = async () => {
    try {
      const { url: quotePdfUrl } = await fetchPdfUrl(false)
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
      const { content } = await fetchPdfUrl(true)

      const iframe = document.createElement('iframe')
      iframe.setAttribute('style', 'display:none;')
      document.getElementById('bundle-container')?.appendChild(iframe)
      iframe.contentDocument?.open()
      iframe.contentDocument?.write(content)
      iframe.contentDocument?.close()
      setIsRequestLoading(false)
      iframe.contentWindow?.print()
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

  useEffect(() => {
    const { state } = location

    if (!state) return
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
            ? b3Lang('quoteDetail.submittedQuote')
            : b3Lang('quoteDetail.quoteSubmitted')}
        </Box>
        <Button
          onClick={() => {
            if (+role === 100) {
              copy(window.location.href)
              snackbar.success(b3Lang('quoteDetail.copySuccessful'))
            } else {
              navigate('/quotes')
            }
          }}
          variant="text"
          sx={{
            color: '#ffffff',
            textAlign: 'left',
            padding: 0,
          }}
        >
          {+role === 100
            ? b3Lang('quoteDetail.copyQuoteLink')
            : b3Lang('quoteDetail.reviewAllQuotes')}
        </Button>
      </Box>
    )

    setTimeout(() => {
      snackbar.success('', {
        jsx: () => tip(),
        isClose: true,
        duration: 30000,
      })
    }, 10)
    location.state = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate, role])

  const isEnableProductShowCheckout = () => {
    if (isEnableProduct) {
      if (isHandleApprove && isHideQuoteCheckout) return true
      if (!isHideQuoteCheckout) return true

      return false
    }

    return true
  }

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
          quoteTitle={quoteDetail.quoteTitle}
          salesRepInfo={quoteDetail.salesRepInfo}
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
          spacing={isMobile ? 2 : 0}
          rowSpacing={0}
          sx={{
            overflow: 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingBottom: '20px',
            marginBottom: isMobile ? '6rem' : 0,
            marginTop: !isMobile ? '1rem' : 0,
            '@media print': {
              overflow: 'hidden',
            },
          }}
        >
          <Grid
            item
            xs={isMobile ? 12 : 8}
            rowSpacing={0}
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                    pl: '16px',
                  }
                : {
                    mr: '16px',
                  }
            }
          >
            <Box
              sx={
                isMobile
                  ? {
                      flexBasis: '100%',
                    }
                  : {}
              }
            >
              <QuoteDetailTable
                total={productList.length}
                currency={quoteDetail.currency}
                isHandleApprove={isHandleApprove}
                getQuoteTableDetails={getQuoteTableDetails}
                getTaxRate={getTaxRate}
                displayDiscount={quoteDetail.displayDiscount}
              />
            </Box>
          </Grid>

          <Grid
            item
            xs={isMobile ? 12 : 4}
            rowSpacing={0}
            sx={
              isMobile
                ? {
                    flexBasis: '100%',
                  }
                : {
                    pl: 0,
                  }
            }
          >
            <Box
              sx={{
                marginBottom: '1rem',
              }}
            >
              <QuoteDetailSummary
                isHideQuoteCheckout={isHideQuoteCheckout}
                quoteSummary={quoteSummary}
                quoteDetailTax={quoteDetailTax}
                status={quoteDetail.status}
                quoteDetail={quoteDetail}
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
                email={emailAddress || ''}
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

        {+role !== 2 &&
          +quoteDetail.status !== 4 &&
          isShowFooter &&
          quoteDetail?.allowCheckout &&
          isEnableProductShowCheckout() && (
            <QuoteDetailFooter
              quoteId={quoteDetail.id}
              role={role}
              isAgenting={isAgenting}
              status={quoteDetail.status}
              proceedingCheckoutFn={proceedingCheckoutFn}
            />
          )}
      </Box>
    </B3Sping>
  )
}

export default QuoteDetail
