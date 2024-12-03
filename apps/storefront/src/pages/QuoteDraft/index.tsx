import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { B2BEvent, useB2BCallback } from '@b3/hooks';
import { useB3Lang } from '@b3/lang';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import cloneDeep from 'lodash-es/cloneDeep';

import CustomButton from '@/components/button/CustomButton';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile, useSetCountry } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import {
  createBCQuote,
  createQuote,
  getB2BCustomerAddresses,
  getBCCustomerAddresses,
} from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import {
  activeCurrencyInfoSelector,
  isB2BUserSelector,
  resetDraftQuoteInfo,
  resetDraftQuoteList,
  rolePermissionSelector,
  setDraftQuoteInfo,
  setQuoteUserId,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { AddressItemType, BCAddressItemType } from '@/types/address';
import { BillingAddress, ContactInfoKeys, ShippingAddress } from '@/types/quotes';
import { B3LStorage, channelId, snackbar, storeHash } from '@/utils';
import { addQuoteDraftProducts, getVariantInfoOOSAndPurchase } from '@/utils/b3Product/b3Product';
import { deleteCartData } from '@/utils/cartUtils';
import validateObject from '@/utils/quoteUtils';

import { getProductOptionsFields } from '../../utils/b3Product/shared/config';
import { convertBCToB2BAddress } from '../Address/shared/config';
import { type PageProps } from '../PageProps';
import AddToQuote from '../quote/components/AddToQuote';
import ContactInfo from '../quote/components/ContactInfo';
import QuoteAddress from '../quote/components/QuoteAddress';
import QuoteAttachment from '../quote/components/QuoteAttachment';
import QuoteInfo from '../quote/components/QuoteInfo';
import QuoteNote from '../quote/components/QuoteNote';
import QuoteStatus from '../quote/components/QuoteStatus';
import QuoteSubmissionResponse from '../quote/components/QuoteSubmissionResponse';
import QuoteSummary from '../quote/components/QuoteSummary';
import QuoteTable from '../quote/components/QuoteTable';
import getAccountFormFields from '../quote/config';
import Container from '../quote/style';

type BCAddress = {
  node: BCAddressItemType;
};

type B2BAddress = {
  node: AddressItemType;
};

export interface Country {
  countryCode: string;
  countryName: string;
  id?: string;
}

interface InfoRefProps extends HTMLInputElement {
  getContactInfoValue: () => any;
  setShippingInfoValue: (address: any) => void;
}

interface QuoteSummaryRef extends HTMLInputElement {
  refreshSummary: () => void;
}

const shippingAddress = {
  address: '',
  addressId: 0,
  apartment: '',
  city: '',
  country: '',
  firstName: '',
  label: '',
  lastName: '',
  phoneNumber: '',
  state: '',
  zipCode: '',
  companyName: '',
};

const billingAddress = {
  address: '',
  addressId: 0,
  apartment: '',
  city: '',
  country: '',
  firstName: '',
  label: '',
  lastName: '',
  phoneNumber: '',
  state: '',
  zipCode: '',
  companyName: '',
};

function QuoteDraft({ setOpenPage }: PageProps) {
  const {
    state: { countriesList, openAPPParams },
  } = useContext(GlobalContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id);
  const companyName = useAppSelector(({ company }) => company.companyInfo.companyName);
  const customer = useAppSelector(({ company }) => company.customer);
  const role = useAppSelector(({ company }) => company.customer.role);
  const dispatch = useAppDispatch();
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );
  const draftQuoteList = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteList);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const salesRepCompanyName = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.companyName,
  );
  const quoteInfo = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteInfo);
  const currency = useAppSelector(activeCurrencyInfoSelector);
  const b2bPermissions = useAppSelector(rolePermissionSelector);
  const quoteSubmissionResponseInfo = useAppSelector(
    ({ global }) => global.quoteSubmissionResponse,
  );

  const isEnableProduct = useAppSelector(
    ({ global }) => global.blockPendingQuoteNonPurchasableOOS.isEnableProduct,
  );

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const quotesActionsPermission = useMemo(() => {
    return isB2BUser ? b2bPermissions.quotesActionsPermission : true;
  }, [isB2BUser, b2bPermissions]);

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const [loading, setLoading] = useState<boolean>(false);

  const [isEdit, setEdit] = useState<boolean>(false);

  const [addressList, setAddressList] = useState<B2BAddress[]>([]);

  const [shippingSameAsBilling, setShippingSameAsBilling] = useState<boolean>(false);
  const [billingChange, setBillingChange] = useState<boolean>(false);
  const [quoteSubmissionResponseOpen, setQuoteSubmissionResponseOpen] = useState<boolean>(false);
  const [quoteId, setQuoteId] = useState<string | number>('');
  const [currentCreatedAt, setCurrentCreatedAt] = useState<string | number>('');

  const quoteSummaryRef = useRef<QuoteSummaryRef | null>(null);

  useSetCountry();

  const contactInfoRef = useRef<InfoRefProps | null>(null);
  const billingRef = useRef<InfoRefProps | null>(null);
  const shippingRef = useRef<InfoRefProps | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const setCustomInfo = (quoteInfo: any) => {
        const newInfo = {
          ...quoteInfo,
        };
        newInfo.contactInfo = {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.emailAddress,
          companyName: companyName || salesRepCompanyName || '',
          phoneNumber: customer.phoneNumber,
        };
        dispatch(setDraftQuoteInfo(newInfo));
      };

      const info = cloneDeep(quoteInfo);

      try {
        if (isB2BUser) {
          const companyId = companyB2BId || salesRepCompanyId;
          const {
            addresses: { edges: addressB2BList = [] },
          } = await getB2BCustomerAddresses(+companyId);

          const shippingDefaultAddress = addressB2BList.find(
            (item: B2BAddress) => item?.node?.isDefaultShipping === 1,
          );
          const billingDefaultAddress = addressB2BList.find(
            (item: B2BAddress) => item?.node?.isDefaultBilling === 1,
          );

          if (shippingDefaultAddress && validateObject(info, 'shippingAddress')) {
            const addressItem = {
              label: shippingDefaultAddress?.node?.label || '',
              firstName: shippingDefaultAddress?.node?.firstName || '',
              lastName: shippingDefaultAddress?.node?.lastName || '',
              companyName: shippingDefaultAddress?.node?.company || '',
              country: shippingDefaultAddress?.node?.countryCode || '',
              address: shippingDefaultAddress?.node?.addressLine1 || '',
              apartment: shippingDefaultAddress?.node?.addressLine2 || '',
              city: shippingDefaultAddress?.node?.city || '',
              state: shippingDefaultAddress?.node?.state || '',
              zipCode: shippingDefaultAddress?.node?.zipCode || '',
              phoneNumber: shippingDefaultAddress?.node?.phoneNumber || '',
              addressId: shippingDefaultAddress?.node?.id ? +shippingDefaultAddress.node.id : 0,
            };

            info.shippingAddress = addressItem as ShippingAddress;
          }
          if (
            billingDefaultAddress &&
            (!info?.billingAddress || validateObject(info, 'billingAddress'))
          ) {
            const addressItem = {
              label: billingDefaultAddress?.node?.label || '',
              firstName: billingDefaultAddress?.node?.firstName || '',
              lastName: billingDefaultAddress?.node?.lastName || '',
              companyName: billingDefaultAddress?.node?.company || '',
              country: billingDefaultAddress?.node?.countryCode || '',
              address: billingDefaultAddress?.node?.addressLine1 || '',
              apartment: billingDefaultAddress?.node?.addressLine2 || '',
              city: billingDefaultAddress?.node?.city || '',
              state: billingDefaultAddress?.node?.state || '',
              zipCode: billingDefaultAddress?.node?.zipCode || '',
              phoneNumber: billingDefaultAddress?.node?.phoneNumber || '',
              addressId: billingDefaultAddress?.node?.id ? +billingDefaultAddress.node.id : 0,
            };

            info.billingAddress = addressItem as BillingAddress;
          }

          setAddressList(addressB2BList);
        } else if (role !== 100) {
          const {
            customerAddresses: { edges: addressBCList = [] },
          } = await getBCCustomerAddresses();

          const list = addressBCList.map((address: BCAddress) => ({
            node: convertBCToB2BAddress(address.node),
          }));
          setAddressList(list);
        }
      } finally {
        if (info && (!info?.contactInfo || validateObject(info, 'contactInfo')) && +role !== 100) {
          setCustomInfo(info);
        } else if (info) {
          dispatch(setDraftQuoteInfo(info));
        }

        const quoteUserId = customer.b2bId || customer.id || 0;
        dispatch(setQuoteUserId(+quoteUserId));

        setLoading(false);
      }
    };

    init();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAddress = () => {
    const addressSaveInfo = {
      shippingAddress,
      billingAddress,
    };

    if (billingRef?.current) {
      addressSaveInfo.billingAddress = billingRef.current.getContactInfoValue();
    }
    if (shippingRef?.current) {
      addressSaveInfo.shippingAddress = shippingRef.current.getContactInfoValue();
    }

    return addressSaveInfo;
  };

  const handleSaveInfoClick = async () => {
    const saveInfo = cloneDeep(quoteInfo);
    if (contactInfoRef?.current) {
      const contactInfo = await contactInfoRef.current.getContactInfoValue();
      if (!contactInfo) return;
      saveInfo.contactInfo = contactInfo;
    }

    const { shippingAddress, billingAddress } = getAddress();

    saveInfo.shippingAddress = shippingAddress;
    saveInfo.billingAddress = billingAddress;

    const isComplete = Object.keys(saveInfo.contactInfo).every((key: string) => {
      if (key === 'phoneNumber' || key === 'companyName' || key === 'quoteTitle') {
        return true;
      }
      return !!saveInfo.contactInfo[key as ContactInfoKeys];
    });

    if (isComplete) {
      dispatch(setDraftQuoteInfo(saveInfo));
      setEdit(false);
    }
  };

  const handleEditInfoClick = () => {
    setEdit(true);
  };

  const accountFormFields = getAccountFormFields(isMobile, b3Lang);

  const updateSummary = () => {
    quoteSummaryRef.current?.refreshSummary();
  };

  const addToQuote = (products: CustomFieldItems[]) => {
    addQuoteDraftProducts(products);
  };

  const getFileList = (files: CustomFieldItems[]) => {
    if (role === 100) {
      return [];
    }

    return files.map((file) => ({
      fileUrl: file.fileUrl,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
    }));
  };

  const handleReset = () => {
    dispatch(resetDraftQuoteInfo());
    dispatch(resetDraftQuoteList());
    B3LStorage.delete('cartToQuoteId');
  };

  const handleAfterSubmit = (
    inpQuoteId?: string | number,
    inpCurrentCreatedAt?: string | number,
  ) => {
    const currentQuoteId = inpQuoteId || quoteId;
    const createdAt = inpCurrentCreatedAt || currentCreatedAt;

    if (currentQuoteId) {
      handleReset();
      navigate(`/quoteDetail/${currentQuoteId}?date=${createdAt}`, {
        state: {
          to: 'draft',
        },
      });
    }
  };

  const handleSubmit = useB2BCallback(
    B2BEvent.OnQuoteCreate,
    async (dispatchOnQuoteCreateEvent) => {
      setLoading(true);
      try {
        const info = cloneDeep(quoteInfo);
        const contactInfo = info?.contactInfo || {};

        const quoteTitle = contactInfo?.quoteTitle || '';

        if ('quoteTitle' in contactInfo) delete contactInfo.quoteTitle;

        const isComplete = Object.keys(contactInfo).every((key: string) => {
          if (key === 'phoneNumber' || key === 'companyName') {
            return true;
          }

          return contactInfo && !!contactInfo[key as ContactInfoKeys];
        });

        if (validateObject(quoteInfo, 'contactInfo') || !isComplete) {
          snackbar.error(b3Lang('quoteDraft.addQuoteInfo'));
          return;
        }

        if (!draftQuoteList || draftQuoteList.length === 0) {
          snackbar.error(b3Lang('quoteDraft.submit'));
          return;
        }

        if (!isEnableProduct) {
          const itHasInvalidProduct = draftQuoteList.some((item) => {
            return getVariantInfoOOSAndPurchase(item)?.name;
          });

          if (itHasInvalidProduct) {
            snackbar.error(b3Lang('quoteDraft.submit.errorTip'));
            return;
          }
        }

        const note = info?.note || '';
        const newNote = note.trim().replace(/[\r\n]/g, '\\n');

        const perfectAddress = (address: ShippingAddress | BillingAddress) => {
          const newAddress = cloneDeep(address);

          const countryItem = countriesList?.find(
            (item: Country) => item.countryCode === newAddress.country,
          );

          if (countryItem) {
            newAddress.country = countryItem.countryName;
          }

          newAddress.address = address?.address || '';
          newAddress.apartment = address?.apartment || '';

          return newAddress;
        };

        const { shippingAddress: editShippingAddress, billingAddress: editBillingAddress } =
          billingRef?.current ? getAddress() : info;

        const shippingAddress = editShippingAddress ? perfectAddress(editShippingAddress) : {};

        const billingAddress = editBillingAddress ? perfectAddress(editBillingAddress) : {};

        let allPrice = 0;
        let allTaxPrice = 0;

        const calculationTime = (value: string | number) => {
          if (typeof value === 'string' && value.includes('-')) {
            return `${new Date(value).getTime() / 1000}`;
          }
          return value;
        };

        const productList = draftQuoteList.map((item) => {
          const { node } = item;
          const product = {
            ...node.productsSearch,
            selectOptions: node?.optionList || '',
          };

          const productFields = getProductOptionsFields(product, {});
          const optionsList =
            productFields
              .map((item) => ({
                optionId: item.optionId,
                optionValue:
                  item.fieldType === 'date' ? calculationTime(item.optionValue) : item.optionValue,
                optionLabel: `${item.valueText}`,
                optionName: item.valueLabel,
                type: item?.fieldOriginType || item.fieldType,
              }))
              .filter((list: CustomFieldItems) => !!list.optionName) || [];

          const variants = node?.productsSearch?.variants;
          let variantsItem;
          if (Array.isArray(variants)) {
            variantsItem = variants.find((item) => item.sku === node.variantSku);
          }

          allPrice += +(node?.basePrice || 0) * +(node?.quantity || 0);

          allTaxPrice += +(node?.taxPrice || 0) * +(node?.quantity || 0);

          const items = {
            productId: node?.productsSearch?.id,
            sku: node.variantSku,
            basePrice: (+(node?.basePrice || 0)).toFixed(currency.decimal_places),
            discount: '0.00',
            offeredPrice: (+(node?.basePrice || 0)).toFixed(currency.decimal_places),
            quantity: node.quantity,
            variantId: variantsItem?.variant_id,
            imageUrl: node.primaryImage,
            productName: node.productName,
            options: optionsList,
          };

          return items;
        });

        const fileList = getFileList(quoteInfo?.fileInfo || []);

        const data = {
          message: newNote,
          legalTerms: '',
          totalAmount: enteredInclusiveTax
            ? allPrice.toFixed(currency.decimal_places)
            : (allPrice + allTaxPrice).toFixed(currency.decimal_places),
          grandTotal: allPrice.toFixed(currency.decimal_places),
          subtotal: allPrice.toFixed(currency.decimal_places),
          companyId: isB2BUser ? companyB2BId || salesRepCompanyId : '',
          storeHash,
          quoteTitle,
          discount: '0.00',
          channelId,
          userEmail: customer.emailAddress,
          shippingAddress,
          billingAddress,
          contactInfo,
          productList,
          fileList,
          taxTotal: allTaxPrice.toFixed(currency.decimal_places),
          currency: {
            currencyExchangeRate: currency.currency_exchange_rate,
            token: currency.token,
            location: currency.token_location,
            decimalToken: currency.decimal_token,
            decimalPlaces: currency.decimal_places,
            thousandsToken: currency.thousands_token,
            currencyCode: currency.currency_code,
          },
        };

        const fn = +role === 99 ? createBCQuote : createQuote;

        if (!dispatchOnQuoteCreateEvent(data)) {
          throw new Error();
        }

        const {
          quoteCreate: {
            quote: { id, createdAt },
          },
        } = await fn(data);

        setQuoteId(id);
        setCurrentCreatedAt(createdAt);

        if (id) {
          const cartId = B3LStorage.get('cartToQuoteId');
          const deleteCartObject = deleteCartData(cartId);

          await deleteCart(deleteCartObject);
        }

        if (quoteSubmissionResponseInfo.value === '0') {
          handleAfterSubmit(id, createdAt);
        } else {
          setQuoteSubmissionResponseOpen(true);
        }
      } catch (error: any) {
        if (error.message && error.message.length > 0) {
          snackbar.error(error.message, {
            isClose: true,
          });
        }
      } finally {
        setLoading(false);
      }
    },
  );

  const handleCloseQuoteSubmissionResponse = () => {
    setQuoteSubmissionResponseOpen(false);

    handleAfterSubmit();
  };

  const backText = () => {
    let text =
      +role === 100
        ? b3Lang('quoteDraft.button.back')
        : b3Lang('quoteDraft.button.backToQuoteLists');
    if (openAPPParams?.quoteBtn === 'open') {
      text = b3Lang('quoteDraft.button.back');
    } else if (openAPPParams?.quoteBtn === 'add') {
      text = b3Lang('quoteDraft.button.backToProduct');
    }

    return text;
  };

  useEffect(() => {
    if (billingChange && shippingSameAsBilling) {
      if (billingRef.current) {
        const billingAddress = billingRef.current.getContactInfoValue();

        if (shippingRef.current) {
          shippingRef.current.setShippingInfoValue(billingAddress);
        }
      }
    }
  }, [billingChange, shippingSameAsBilling]);

  return (
    <B3Spin isSpinning={loading}>
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
                navigate('/');
                setOpenPage({
                  isOpen: false,
                  openUrl: '',
                });
              } else {
                navigate('/quotes');
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
            <p
              style={{
                margin: '0',
              }}
            >
              {backText()}
            </p>
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
          {quotesActionsPermission && (
            <Box>
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
          )}
        </Box>

        <Box>
          {!isEdit && (
            <QuoteInfo
              status="Draft"
              contactInfo={quoteInfo?.contactInfo}
              shippingAddress={quoteInfo?.shippingAddress}
              billingAddress={quoteInfo?.billingAddress || {}}
              handleEditInfoClick={handleEditInfoClick}
            />
          )}
          {isEdit && (
            <Container flexDirection="column">
              <ContactInfo
                emailAddress={customer.emailAddress}
                info={quoteInfo?.contactInfo}
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
                  info={quoteInfo?.billingAddress}
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
                  info={quoteInfo?.shippingAddress}
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
                label={b3Lang('quoteDraft.checkbox.sameAddressShippingAndBilling')}
                control={
                  <Checkbox
                    checked={shippingSameAsBilling}
                    onChange={(e) => {
                      setShippingSameAsBilling(e.target.checked);
                      if (billingRef.current) {
                        const billingAddress = billingRef.current.getContactInfoValue();

                        if (shippingRef.current && e.target.checked) {
                          shippingRef.current.setShippingInfoValue(billingAddress);
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
              updateSummary={updateSummary}
              total={draftQuoteList.length}
              items={draftQuoteList}
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
                updateList={updateSummary}
                addToQuote={addToQuote}
                isB2BUser={isB2BUser}
              />

              <QuoteNote quoteStatus="Draft" />

              {role !== 100 && <QuoteAttachment status={0} />}
            </Stack>
          </Container>
        </Box>
      </Box>

      <QuoteSubmissionResponse
        isOpen={quoteSubmissionResponseOpen}
        onClose={handleCloseQuoteSubmissionResponse}
        quoteSubmissionResponseInfo={quoteSubmissionResponseInfo}
      />
    </B3Spin>
  );
}

export default QuoteDraft;
