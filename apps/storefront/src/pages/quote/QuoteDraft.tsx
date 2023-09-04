import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import { ArrowBackIosNew } from '@mui/icons-material'
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'

import { B3Sping, CustomButton } from '@/components'
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile, useSetCountry } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import {
  createBCQuote,
  createQuote,
  getB2BCustomerAddresses,
  getBCCustomerAddresses,
} from '@/shared/service/b2b'
import { deleteCart } from '@/shared/service/bc'
import { store } from '@/store'
import { AddressItemType, BCAddressItemType } from '@/types/address'
import {
  addQuoteDraftProducts,
  B3LStorage,
  B3SStorage,
  getActiveCurrencyInfo,
  getDefaultCurrencyInfo,
  snackbar,
  storeHash,
} from '@/utils'

import { getProductOptionsFields } from '../../utils/b3Product/shared/config'
import { convertBCToB2BAddress } from '../address/shared/config'

import AddToQuote from './components/AddToQuote'
import ContactInfo from './components/ContactInfo'
import QuoteAddress from './components/QuoteAddress'
import QuoteAttachment from './components/QuoteAttachment'
import QuoteInfo from './components/QuoteInfo'
import QuoteNote from './components/QuoteNote'
import QuoteStatus from './components/QuoteStatus'
import QuoteSummary from './components/QuoteSummary'
import QuoteTable from './components/QuoteTable'
import { QuoteListitemProps } from './shared/config'
import getAccountFormFields from './config'
import Container from './style'

type BCAddress = {
  node: BCAddressItemType
}

type B2BAddress = {
  node: AddressItemType
}

export interface Country {
  countryCode: string
  countryName: string
  id?: string
}

interface GetValue {
  [key: string]: string
}
interface InfoRefProps extends HTMLInputElement {
  getContactInfoValue: () => GetValue
  setShippingInfoValue: (address: any) => void
}

interface InfoProps {
  contactInfo: GetValue
  shippingAddress: GetValue
  billingAddress: GetValue
}

interface QuoteTableRef extends HTMLInputElement {
  refreshList: () => void
}

interface QuoteSummaryRef extends HTMLInputElement {
  refreshSummary: () => void
}

interface OpenPageState {
  isOpen: boolean
  openUrl?: string
}

interface QuoteDraftProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

function QuoteDraft({ setOpenPage }: QuoteDraftProps) {
  const {
    state: {
      role,
      isB2BUser,
      customerId,
      B3UserId,
      currentChannelId,
      salesRepCompanyId,
      salesRepCompanyName,
      companyInfo: { id: companyB2BId, companyName },
      countriesList,
      customer,
      emailAddress,
      currentChannelId: channelId,
      openAPPParams,
    },
  } = useContext(GlobaledContext)

  const {
    global: { enteredInclusive: enteredInclusiveTax },
  } = store.getState()

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const { decimal_places: decimalPlaces = 2 } = getActiveCurrencyInfo()

  const navigate = useNavigate()

  const b3Lang = useB3Lang()

  const [isMobile] = useMobile()

  const [loading, setLoading] = useState<boolean>(false)

  const [isEdit, setEdit] = useState<boolean>(false)

  const [addressList, setAddressList] = useState<B2BAddress[]>([])

  const [total, setTotal] = useState<number>(0)

  const [info, setInfo] = useState<InfoProps>({
    contactInfo: {},
    shippingAddress: {},
    billingAddress: {},
  })
  const [shippingSameAsBilling, setShippingSameAsBilling] =
    useState<boolean>(false)
  const [billingChange, setBillingChange] = useState<boolean>(false)

  const quoteTableRef = useRef<QuoteTableRef | null>(null)

  const quoteSummaryRef = useRef<QuoteSummaryRef | null>(null)

  useSetCountry()

  const contactInfoRef = useRef<InfoRefProps | null>(null)
  const billingRef = useRef<InfoRefProps | null>(null)
  const shippingRef = useRef<InfoRefProps | null>(null)

  const setCustomInfo = (quoteInfo: any) => {
    const newInfo = {
      ...quoteInfo,
    }
    newInfo.contactInfo = {
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.emailAddress,
      companyName: companyName || salesRepCompanyName || '',
      phoneNumber: customer.phoneNumber,
    }
    setInfo(newInfo)
    B3LStorage.set('MyQuoteInfo', newInfo)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const MyQuoteInfo = B3LStorage.get('MyQuoteInfo') || {}

        const quoteInfo = {
          contactInfo: {},
          shippingAddress: {},
          billingAddress: {},
          ...MyQuoteInfo,
        }

        if (isB2BUser) {
          const companyId = companyB2BId || salesRepCompanyId
          const {
            addresses: { edges: addressB2BList = [] },
          } = await getB2BCustomerAddresses(+companyId)

          const shippingDefautAddress = addressB2BList.find(
            (item: B2BAddress) => item?.node?.isDefaultShipping === 1
          )
          const billingDefautAddress = addressB2BList.find(
            (item: B2BAddress) => item?.node?.isDefaultBilling === 1
          )
          if (
            shippingDefautAddress &&
            (!quoteInfo?.shippingAddress ||
              JSON.stringify(quoteInfo.shippingAddress) === '{}')
          ) {
            const addressItem = {
              label: shippingDefautAddress?.node?.label || '',
              firstName: shippingDefautAddress?.node?.firstName || '',
              lastName: shippingDefautAddress?.node?.lastName || '',
              companyName: shippingDefautAddress?.node?.company || '',
              country: shippingDefautAddress?.node?.countryCode || '',
              address: shippingDefautAddress?.node?.addressLine1 || '',
              apartment: shippingDefautAddress?.node?.addressLine2 || '',
              city: shippingDefautAddress?.node?.city || '',
              state: shippingDefautAddress?.node?.state || '',
              zipCode: shippingDefautAddress?.node?.zipCode || '',
              phoneNumber: shippingDefautAddress?.node?.phoneNumber || '',
            }

            quoteInfo.shippingAddress = addressItem
          }
          if (
            billingDefautAddress &&
            (!quoteInfo?.billingAddress ||
              JSON.stringify(quoteInfo.billingAddress) === '{}')
          ) {
            const addressItem = {
              label: billingDefautAddress?.node?.label || '',
              firstName: billingDefautAddress?.node?.firstName || '',
              lastName: billingDefautAddress?.node?.lastName || '',
              companyName: billingDefautAddress?.node?.company || '',
              country: billingDefautAddress?.node?.countryCode || '',
              address: billingDefautAddress?.node?.addressLine1 || '',
              apartment: billingDefautAddress?.node?.addressLine2 || '',
              city: billingDefautAddress?.node?.city || '',
              state: billingDefautAddress?.node?.state || '',
              zipCode: billingDefautAddress?.node?.zipCode || '',
              phoneNumber: billingDefautAddress?.node?.phoneNumber || '',
            }

            quoteInfo.billingAddress = addressItem
          }

          setAddressList(addressB2BList)
        } else if (role !== 100) {
          const {
            customerAddresses: { edges: addressBCList = [] },
          } = await getBCCustomerAddresses()

          const list = addressBCList.map((address: BCAddress) => ({
            node: convertBCToB2BAddress(address.node),
          }))
          setAddressList(list)
        }

        if (
          quoteInfo &&
          (!quoteInfo?.contactInfo ||
            JSON.stringify(quoteInfo.contactInfo) === '{}') &&
          +role !== 100
        ) {
          setCustomInfo(quoteInfo)
        } else if (quoteInfo) {
          setInfo(quoteInfo)
        }
      } finally {
        B3LStorage.set('quoteDraftUserId', B3UserId || customerId || 0)
        setLoading(false)
      }
    }

    init()
  }, [])

  const getAddress = () => {
    const addresssaveInfo = {
      shippingAddress: {},
      billingAddress: {},
    }
    if (billingRef?.current) {
      addresssaveInfo.billingAddress = billingRef.current.getContactInfoValue()
    }
    if (shippingRef?.current) {
      addresssaveInfo.shippingAddress =
        shippingRef.current.getContactInfoValue()
    }

    return addresssaveInfo
  }

  const handleSaveInfoClick = async () => {
    const saveInfo = {
      ...info,
    }
    if (contactInfoRef?.current) {
      const contactInfo = await contactInfoRef.current.getContactInfoValue()
      if (!contactInfo) return
      saveInfo.contactInfo = contactInfo
    }

    const { shippingAddress, billingAddress } = getAddress()

    saveInfo.shippingAddress = shippingAddress
    saveInfo.billingAddress = billingAddress

    const isComplete = Object.keys(saveInfo.contactInfo).every(
      (key: string) => {
        if (key === 'phoneNumber' || key === 'companyName') {
          return true
        }
        return !!saveInfo.contactInfo[key]
      }
    )

    if (isComplete) {
      B3LStorage.set('MyQuoteInfo', saveInfo)
      setInfo(saveInfo)
      setEdit(false)
    }
  }

  const handleEditInfoClick = () => {
    setEdit(true)
  }

  const getQuoteTableDetails = async (params: CustomFieldItems) => {
    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []

    const startIndex = +params.offset
    const endIndex = +params.first + startIndex

    setTotal(quoteDraftAllList.length)
    if (!quoteDraftAllList.length) {
      return {
        edges: [],
        totalCount: 0,
      }
    }
    const list = quoteDraftAllList.slice(startIndex, endIndex)

    list.forEach((item: any) => {
      let additionalCalculatedPriceTax = 0
      let additionalCalculatedPrice = 0

      if (item.node.additionalCalculatedPrices?.length) {
        item.node.additionalCalculatedPrices.forEach((item: any) => {
          additionalCalculatedPriceTax += item.additionalCalculatedPriceTax
          additionalCalculatedPrice += item.additionalCalculatedPrice
        })
      }

      item.node.basePrice = +item.node.basePrice + additionalCalculatedPrice
      item.node.tax = +item.node.tax + additionalCalculatedPriceTax
    })

    return {
      edges: list,
      totalCount: quoteDraftAllList.length,
    }
  }

  const accountFormFields = getAccountFormFields(isMobile, b3Lang)

  const updateSummary = () => {
    quoteSummaryRef.current?.refreshSummary()
  }

  const updateList = () => {
    quoteTableRef.current?.refreshList()
    updateSummary()
  }

  const addToQuote = (products: CustomFieldItems[]) => {
    addQuoteDraftProducts(products)

    quoteTableRef.current?.refreshList()
  }

  const getFileList = (files: CustomFieldItems[]) => {
    if (role === 100) {
      return []
    }

    return files.map((file) => ({
      fileUrl: file.fileUrl,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const info = B3LStorage.get('MyQuoteInfo')
      const contactInfo = info?.contactInfo || {}

      const isComplete = Object.keys(contactInfo).every((key: string) => {
        if (key === 'phoneNumber' || key === 'companyName') {
          return true
        }
        return !!contactInfo[key]
      })

      if (JSON.stringify(contactInfo) === '{}' || !isComplete) {
        snackbar.error(b3Lang('quoteDraft.addQuoteInfo'))
        return
      }

      const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList')

      if (!b2bQuoteDraftList || b2bQuoteDraftList.length === 0) {
        snackbar.error(b3Lang('quoteDraft.submit'))
        return
      }

      const emailAddress = B3SStorage.get('B3EmailAddress')

      const note = info?.note || ''
      const newNote = note.trim().replace(/[\r\n]/g, '\\n')

      const perfectAddress = (address: CustomFieldStringItems) => {
        const newAddress = {
          ...address,
        }

        const countryItem = countriesList?.find(
          (item: Country) => item.countryCode === newAddress.country
        )

        if (countryItem) {
          newAddress.country = countryItem.countryName
        }

        newAddress.addressLine1 = address?.address || ''
        newAddress.addressLine2 = address?.apartment || ''

        return newAddress
      }

      const {
        shippingAddress: editShippingAddress,
        billingAddress: editBillingAddress,
      } = billingRef?.current ? getAddress() : info

      const shippingAddress = editShippingAddress
        ? perfectAddress(editShippingAddress)
        : {}

      const billingAddress = editBillingAddress
        ? perfectAddress(editBillingAddress)
        : {}

      let allPrice = 0
      let allTaxPrice = 0

      const calculationTime = (value: string | number) => {
        if (typeof value === 'string' && value.includes('-')) {
          return `${new Date(value).getTime() / 1000}`
        }
        return value
      }

      const productList = b2bQuoteDraftList.map((item: QuoteListitemProps) => {
        const { node } = item
        const product: any = {
          ...node.productsSearch,
          selectOptions: node?.optionList || '',
        }

        const productFields = getProductOptionsFields(product, {})
        const optionsList: CustomFieldItems[] =
          productFields
            .map((item) => ({
              optionId: item.optionId,
              optionValue:
                item.fieldType === 'date'
                  ? calculationTime(item.optionValue)
                  : item.optionValue,
              optionLabel: `${item.valueText}`,
              optionName: item.valueLabel,
            }))
            .filter((list: CustomFieldItems) => !!list.optionName) || []

        const varants = node.productsSearch.variants
        const varantsItem = varants.find(
          (item: CustomFieldItems) => item.sku === node.variantSku
        )

        // const salePrice = getBCPrice(+(node?.basePrice || 0), +(node?.taxPrice || 0))

        allPrice += +(node?.basePrice || 0) * +(node?.quantity || 0)

        allTaxPrice += +(node?.taxPrice || 0) * +(node?.quantity || 0)

        const items = {
          productId: node.productsSearch.id,
          sku: node.variantSku,
          basePrice: (+(node?.basePrice || 0)).toFixed(decimalPlaces),
          discount: '0.00',
          offeredPrice: (+(node?.basePrice || 0)).toFixed(decimalPlaces),
          quantity: node.quantity,
          variantId: varantsItem.variant_id,
          imageUrl: node.primaryImage,
          productName: node.productName,
          options: optionsList,
        }

        return items
      })

      const currency = getDefaultCurrencyInfo()

      const fileList = getFileList(info.fileInfo || [])

      const data = {
        // notes: note,
        message: newNote,
        legalTerms: '',
        totalAmount: enteredInclusiveTax
          ? allPrice.toFixed(decimalPlaces)
          : (allPrice + allTaxPrice).toFixed(decimalPlaces),
        grandTotal: allPrice.toFixed(decimalPlaces),
        subtotal: allPrice.toFixed(decimalPlaces),
        companyId: isB2BUser ? companyB2BId || salesRepCompanyId : '',
        storeHash,
        discount: '0.00',
        channelId,
        userEmail: emailAddress,
        shippingAddress,
        billingAddress,
        contactInfo,
        productList,
        fileList,
        taxTotal: allTaxPrice.toFixed(decimalPlaces),
        currency: {
          currencyExchangeRate: currency.currency_exchange_rate,
          token: currency.token,
          location: currency.token_location,
          decimalToken: currency.decimal_token,
          decimalPlaces: currency.decimal_places,
          thousandsToken: currency.thousands_token,
          currencyCode: currency.currency_code,
        },
      }

      const fn = +role === 99 ? createBCQuote : createQuote

      const {
        quoteCreate: {
          quote: { id, createdAt },
        },
      } = await fn(data)

      if (id) {
        const cartId = B3LStorage.get('cartToQuoteId')

        await deleteCart(cartId)
      }

      navigate(`/quoteDetail/${id}?date=${createdAt}`, {
        state: {
          to: 'draft',
        },
      })

      B3LStorage.delete('b2bQuoteDraftList')
      B3LStorage.delete('MyQuoteInfo')
      B3LStorage.delete('cartToQuoteId')
    } catch (error: any) {
      snackbar.error(error, {
        isClose: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const backText = () => {
    let text =
      +role === 100
        ? b3Lang('quoteDraft.button.back')
        : b3Lang('quoteDraft.button.backToQuoteLists')
    if (openAPPParams?.quoteBtn === 'open') {
      text = b3Lang('quoteDraft.button.back')
    } else if (openAPPParams?.quoteBtn === 'add') {
      text = b3Lang('quoteDraft.button.backToProduct')
    }

    return text
  }

  useEffect(() => {
    if (billingChange && shippingSameAsBilling) {
      if (billingRef.current) {
        const billingAddress = billingRef.current.getContactInfoValue()

        if (shippingRef.current) {
          shippingRef.current.setShippingInfoValue(billingAddress)
        }
      }
    }
  }, [billingChange])

  return (
    <B3Sping isSpinning={loading}>
      <Box
        sx={{
          mb: '60px',
          width: '100%',
        }}
      >
        <Box
          sx={{
            marginBottom: '10px',
            width: 'fit-content',
            displayPrint: 'none',
          }}
        >
          <Box
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => {
              if (openAPPParams?.quoteBtn || +role === 100) {
                navigate('/')
                setOpenPage({
                  isOpen: false,
                  openUrl: '',
                })
              } else {
                navigate('/quotes')
              }
            }}
          >
            <ArrowBackIosNew
              fontSize="small"
              sx={{
                fontSize: '12px',
                marginRight: '0.5rem',
              }}
            />
            <p>{backText()}</p>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              mb: '24px',
              flexDirection: `${isMobile ? 'column' : 'row'}`,
              alignItems: `${isMobile ? 'flex-start' : 'center'}`,
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontSize: '34px',
                mr: '1rem',
                mb: `${isMobile ? '1rem' : '0'}`,
                color: getContrastColor(backgroundColor),
              }}
            >
              {b3Lang('quoteDraft.title.Quote')}
            </Typography>
            <QuoteStatus code="0" />
          </Box>
          {!isMobile ? (
            <CustomButton
              variant="contained"
              size="small"
              sx={{
                padding: '8px 22px',
                alignSelf: 'center',
                marginBottom: '24px',
              }}
              onClick={handleSubmit}
            >
              {b3Lang('quoteDraft.button.submit')}
            </CustomButton>
          ) : (
            <Box
              sx={{
                position: 'fixed',
                left: 0,
                bottom: 0,
                background: '#FFF',
                width: '100%',
                display: 'flex',
                p: '8px 0',
                zIndex: 100,
                justifyContent: 'center',
              }}
            >
              <CustomButton
                variant="contained"
                size="small"
                sx={{
                  height: '38px',
                  width: '90%',
                }}
                onClick={handleSubmit}
              >
                {b3Lang('quoteDraft.button.submit')}
              </CustomButton>
            </Box>
          )}
        </Box>

        <Box>
          {!isEdit && (
            <QuoteInfo
              status="Draft"
              contactInfo={info?.contactInfo || {}}
              shippingAddress={info?.shippingAddress || {}}
              billingAddress={info?.billingAddress || {}}
              handleEditInfoClick={handleEditInfoClick}
            />
          )}
          {isEdit && (
            <Container flexDirection="column">
              <ContactInfo
                isB2BUser={isB2BUser}
                emailAddress={emailAddress}
                currentChannelId={currentChannelId}
                info={info.contactInfo}
                ref={contactInfoRef}
              />
              <Box
                sx={{
                  display: 'flex',
                  mt: isMobile ? 0 : '3rem',
                  flexDirection: isMobile ? 'column' : 'row',
                }}
              >
                <QuoteAddress
                  title={b3Lang('quoteDraft.section.billing')}
                  info={info?.billingAddress || {}}
                  addressList={addressList}
                  pr={isMobile ? 0 : '8px'}
                  ref={billingRef}
                  role={role}
                  accountFormFields={accountFormFields}
                  shippingSameAsBilling={shippingSameAsBilling}
                  type="billing"
                  setBillingChange={setBillingChange}
                />
                <QuoteAddress
                  title={b3Lang('quoteDraft.section.shipping')}
                  info={info?.shippingAddress || {}}
                  addressList={addressList}
                  pl={isMobile ? 0 : '8px'}
                  ref={shippingRef}
                  role={role}
                  accountFormFields={accountFormFields}
                  shippingSameAsBilling={shippingSameAsBilling}
                  type="shipping"
                  setBillingChange={setBillingChange}
                />
              </Box>
              <FormControlLabel
                label={b3Lang(
                  'quoteDraft.checkbox.sameAddressShippingAndBilling'
                )}
                control={
                  <Checkbox
                    checked={shippingSameAsBilling}
                    onChange={(e) => {
                      setShippingSameAsBilling(e.target.checked)
                      if (billingRef.current) {
                        const billingAddress =
                          billingRef.current.getContactInfoValue()

                        if (shippingRef.current && e.target.checked) {
                          shippingRef.current.setShippingInfoValue(
                            billingAddress
                          )
                        }
                      }
                    }}
                  />
                }
                sx={{
                  mt: 2,
                }}
              />
              <CustomButton
                sx={{
                  mt: '20px',
                  mb: '15px',
                }}
                onClick={handleSaveInfoClick}
                variant="outlined"
              >
                {b3Lang('quoteDraft.button.saveInfo')}
              </CustomButton>
            </Container>
          )}
        </Box>
        <Box
          sx={{
            mt: '20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'flex-start',
          }}
        >
          <Container
            flexDirection="column"
            xs={{
              flexBasis: isMobile ? '100%' : '680px',
              flexGrow: 2,
              marginRight: '20px',
              marginBottom: '20px',
              boxShadow:
                '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
              borderRadius: '4px',
            }}
          >
            <QuoteTable
              ref={quoteTableRef}
              updateList={updateList}
              updateSummary={updateSummary}
              total={total}
              getQuoteTableDetails={getQuoteTableDetails}
              isB2BUser={isB2BUser}
            />
          </Container>

          <Container
            flexDirection="column"
            xs={{
              flexBasis: isMobile ? '100%' : '340px',
              marginBottom: '20px',
              backgroundColor: 'transparent',
              padding: 0,
              flexGrow: 1,
            }}
          >
            <Stack
              spacing={2}
              sx={{
                width: '100%',
              }}
            >
              <QuoteSummary ref={quoteSummaryRef} />
              <AddToQuote
                updateList={updateList}
                addToQuote={addToQuote}
                isB2BUser={isB2BUser}
              />

              <QuoteNote quoteStatus="Draft" />

              {role !== 100 && <QuoteAttachment status={0} />}
            </Stack>
          </Container>
        </Box>
      </Box>
    </B3Sping>
  )
}

export default QuoteDraft
