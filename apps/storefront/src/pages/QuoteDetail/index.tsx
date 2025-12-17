import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Grid } from '@mui/material';
import copy from 'copy-to-clipboard';
import { get } from 'lodash-es';

import B3Spin from '@/components/spin/B3Spin';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useMobile } from '@/hooks/useMobile';
import { useScrollBar } from '@/hooks/useScrollBar';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  exportQuotePdf,
  getB2BQuoteDetail,
  getBcQuoteDetail,
  searchProducts,
} from '@/shared/service/b2b';
import {
  activeCurrencyInfoSelector,
  isB2BUserSelector,
  rolePermissionSelector,
  TaxZoneRates,
  useAppSelector,
} from '@/store';
import { QuoteExtraFieldsData } from '@/types/quotes';
import { verifyLevelPermission } from '@/utils/b3CheckPermissions/check';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';
import { getVariantInfoOOSAndPurchase } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import { snackbar } from '@/utils/b3Tip';
import { getSearchVal } from '@/utils/loginInfo';
import {
  ValidatedProductError,
  validateProducts as rawValidateProducts,
} from '@/utils/validateProducts';

import { FileObjects } from '../quote/components/FileUpload';
import Message from '../quote/components/Message';
import QuoteAttachment from '../quote/components/QuoteAttachment';
import QuoteDetailHeader from '../quote/components/QuoteDetailHeader';
import QuoteDetailSummary from '../quote/components/QuoteDetailSummary';
import QuoteDetailTable from '../quote/components/QuoteDetailTable';
import QuoteInfo from '../quote/components/QuoteInfo';
import QuoteNote from '../quote/components/QuoteNote';
import QuoteTermsAndConditions from '../quote/components/QuoteTermsAndConditions';
import getB2BQuoteExtraFields from '../quote/utils/getQuoteExtraFields';
import { handleQuoteCheckout } from '../quote/utils/quoteCheckout';

interface ProductOption {
  optionId: number;
  optionValue: string;
  optionName?: string;
  optionLabel?: string;
  type?: string;
}

interface ProductInfoProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  offeredPrice: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: string;
  options?: ProductOption[];
  primaryImage: string;
  productId: number;
  productName: string;
  productUrl: string;
  quantity: number | string;
  tax: number | string;
  updatedAt: number;
  variantId: number;
  variantSku: string;
  productsSearch: CustomFieldItems;
}

const validateProducts = (products: ProductInfoProps[]) => {
  const transformedProducts = products.map((product) => ({
    ...product,
    productsSearch: {
      ...product.productsSearch,
      newSelectOptionList: (product.options || []).map((opt) => ({
        optionId: `attribute[${opt.optionId}]`,
        optionValue: opt.optionValue,
      })),
    },
  }));

  return rawValidateProducts(transformedProducts);
};

function useData() {
  const { id = '' } = useParams();

  const {
    state: { bcLanguage, quoteConfig },
  } = useContext(GlobalContext);
  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const emailAddress = useAppSelector(({ company }) => company.customer.emailAddress);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const role = useAppSelector(({ company }) => company.customer.role);

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const taxZoneRates = useAppSelector(({ global }) => global.taxZoneRates);
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );
  const isEnableProduct = useAppSelector(
    ({ global }) => global.blockPendingQuoteNonPurchasableOOS?.isEnableProduct,
  );

  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);

  const handleGetProductsById = async (listProducts: ProductInfoProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = [];

      listProducts.forEach((item) => {
        if (!productIds.includes(item.productId)) {
          productIds.push(item.productId);
        }
      });

      const options = { productIds, currencyCode, companyId, customerGroupId };

      const { productsSearch } = await searchProducts(options);

      const newProductsSearch = conversionProductsList(productsSearch);

      listProducts.forEach((item) => {
        const listProduct = item;
        const productInfo = newProductsSearch.find((search: CustomFieldItems) => {
          const { id: productId } = search;

          return Number(item.productId) === Number(productId);
        });

        listProduct.productsSearch = productInfo || {};
      });

      return listProducts;
    }
    return undefined;
  };

  const location = useLocation();

  const getQuote = async () => {
    const { search } = location;

    const date = getSearchVal(search, 'date') || '';
    const uuid = getSearchVal(search, 'uuid') || '';
    const data = {
      id: Number(id),
      date: date.toString(),
      uuid: uuid ? uuid.toString() : undefined,
    };

    const { quote } = await (Number(role) === 99
      ? getBcQuoteDetail(data)
      : getB2BQuoteDetail(data));

    return quote;
  };

  return {
    id,
    bcLanguage,
    quoteConfig,
    role,
    emailAddress,
    isB2BUser,
    selectCompanyHierarchyId,
    isAgenting,
    taxZoneRates,
    enteredInclusiveTax,
    isEnableProduct,
    purchasabilityPermission,
    handleGetProductsById,
    getQuote,
  };
}

const containerStyle = (isMobile: boolean) => {
  return isMobile
    ? {
        alignItems: 'flex-end',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      };
};

function Footer({ children, isAgenting }: { children: React.ReactNode; isAgenting: boolean }) {
  const [isMobile] = useMobile();
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: '0.8rem 1rem',
        height: 'auto',
        display: 'flex',
        zIndex: '999',
        justifyContent: isMobile ? 'center' : 'flex-end',
        displayPrint: 'none',
        ...containerStyle(isMobile),
      }}
    >
      {children}
    </Box>
  );
}

function ProceedToCheckoutButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [isMobile] = useMobile();
  return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        width: isMobile ? '100%' : 'auto',
      }}
    >
      {children}
    </Button>
  );
}

function QuoteDetail() {
  const navigate = useNavigate();

  const {
    id,
    bcLanguage,
    quoteConfig,
    role,
    emailAddress,
    isB2BUser,
    selectCompanyHierarchyId,
    isAgenting,
    taxZoneRates,
    enteredInclusiveTax,
    isEnableProduct,
    purchasabilityPermission,
    handleGetProductsById,
    getQuote,
  } = useData();

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const [quoteDetail, setQuoteDetail] = useState<any>({});
  const [productList, setProductList] = useState<ProductInfoProps[]>([]);
  const [fileList, setFileList] = useState<FileObjects[]>([]);
  const [quoteReviewedBySalesRep, setQuoteWasReviewedBySalesRep] = useState(false);
  const [isHideQuoteCheckout, setIsHideQuoteCheckout] = useState(true);
  const [quoteValidationErrors, setQuoteValidationErrors] = useState<
    ValidatedProductError<ProductInfoProps>[]
  >([]);
  const [quoteHasWarnings, setQuoteHasWarnings] = useState(true);

  const [quoteSummary, setQuoteSummary] = useState({
    originalSubtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    totalAmount: 0,
  });
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isShowFooter, setIsShowFooter] = useState(false);
  const [quoteDetailTax, setQuoteDetailTax] = useState(0);
  const [noBuyerProductName, setNoBuyerProductName] = useState({
    oos: '',
    nonPurchasable: '',
  });

  const [quotePurchasabilityPermissionInfo, setQuotePurchasabilityPermission] = useState({
    quotePurchasabilityPermission: false,
    quoteConvertToOrderPermission: false,
  });

  const [quoteCheckoutLoading, setQuoteCheckoutLoading] = useState<boolean>(false);

  const [shouldHidePrices, setShouldHidePrices] = useState<boolean>(true);

  const location = useLocation();

  const featureFlags = useFeatureFlags();

  const isMoveStockAndBackorderValidationToBackend =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'];

  const isAutoQuotingEnabled =
    quoteConfig.find((item) => item.key === 'quote_auto_quoting')?.value === '1';

  useEffect(() => {
    if (!quoteDetail?.id) return;

    const { quoteConvertToOrderPermission: quoteCheckoutPermissionCode } = b2bPermissionsMap;

    const getPurchasabilityAndConvertToOrderPermission = () => {
      if (isB2BUser) {
        const companyId = quoteDetail?.companyId?.id || null;
        const userEmail = quoteDetail?.contactInfo?.email || '';
        return {
          quotePurchasabilityPermission: purchasabilityPermission,
          quoteConvertToOrderPermission: verifyLevelPermission({
            code: quoteCheckoutPermissionCode,
            companyId,
            userEmail,
          }),
        };
      }

      return {
        quotePurchasabilityPermission: true,
        quoteConvertToOrderPermission: true,
      };
    };

    const { quotePurchasabilityPermission, quoteConvertToOrderPermission } =
      getPurchasabilityAndConvertToOrderPermission();

    setQuotePurchasabilityPermission({
      quotePurchasabilityPermission,
      quoteConvertToOrderPermission,
    });
  }, [isB2BUser, quoteDetail, selectCompanyHierarchyId, purchasabilityPermission]);

  const quoteDetailBackendValidations = async () => {
    if (!productList.length) {
      return;
    }

    const { error, warning } = await validateProducts(productList);

    if (!error.length && !warning.length) {
      setShouldHidePrices(false);
      setQuoteHasWarnings(false);
    }

    error.forEach((err) => {
      if (err.error.type === 'validation') {
        snackbar.error(err.error.message);
      }
    });

    if (quoteReviewedBySalesRep) {
      setShouldHidePrices(false);
    }

    setQuoteValidationErrors(error);
  };

  const quoteDetailFrontendValidations = () => {
    let oosErrorList = '';
    let nonPurchasableErrorList = '';

    productList.forEach((item: CustomFieldItems) => {
      const buyerInfo = getVariantInfoOOSAndPurchase(item);

      if (buyerInfo?.type && isEnableProduct && !item?.purchaseHandled) {
        if (buyerInfo.type === 'oos') {
          oosErrorList += `${item.productName}${oosErrorList ? ',' : ''}`;
        }

        if (buyerInfo.type === 'non-purchasable') {
          nonPurchasableErrorList += `${item.productName}${nonPurchasableErrorList ? ',' : ''}`;
        }
      }
    });

    const isHideCheckout = !!oosErrorList || !!nonPurchasableErrorList;
    if (isEnableProduct && quoteReviewedBySalesRep && isHideCheckout) {
      if (oosErrorList)
        snackbar.error(
          b3Lang('quoteDetail.message.insufficientStock', {
            ProductName: oosErrorList,
          }),
        );

      if (nonPurchasableErrorList)
        snackbar.error(
          b3Lang('quoteDetail.message.nonPurchasable', {
            ProductName: nonPurchasableErrorList,
          }),
        );
    }

    setIsHideQuoteCheckout(isHideCheckout);

    setNoBuyerProductName({
      oos: oosErrorList,
      nonPurchasable: nonPurchasableErrorList,
    });
  };

  const validateQuoteProducts = isMoveStockAndBackorderValidationToBackend
    ? quoteDetailBackendValidations
    : quoteDetailFrontendValidations;

  const hasQuoteValidationErrorsBackendFlow = () => {
    if (quoteValidationErrors.length) {
      quoteValidationErrors.forEach((err) => {
        if (err.error.type === 'network') {
          snackbar.error(
            b3Lang('quotes.productValidationFailed', {
              productName: err.product.productName || '',
            }),
          );
        } else {
          snackbar.error(err.error.message);
        }
      });

      return true;
    }

    return false;
  };

  useEffect(() => {
    validateQuoteProducts();
    // disabling since b3Lang is a dependency that will trigger rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnableProduct, quoteReviewedBySalesRep, productList]);

  const hasQuoteValidationErrorsFrontendFlow = useCallback(() => {
    if (isHideQuoteCheckout) {
      const { oos, nonPurchasable } = noBuyerProductName;
      if (oos)
        snackbar.error(
          b3Lang('quoteDetail.message.insufficientStock', {
            ProductName: oos,
          }),
        );

      if (nonPurchasable)
        snackbar.error(
          b3Lang('quoteDetail.message.nonPurchasable', {
            ProductName: nonPurchasable,
          }),
        );
    }
    return isHideQuoteCheckout;
    // disabling as b3Lang is a dependency that will trigger rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHideQuoteCheckout, noBuyerProductName]);

  const hasQuoteValidationErrors = isMoveStockAndBackorderValidationToBackend
    ? hasQuoteValidationErrorsBackendFlow
    : hasQuoteValidationErrorsFrontendFlow;

  const classRates: TaxZoneRates[] = [];
  if (taxZoneRates?.length) {
    const defaultTaxZone = taxZoneRates?.find((taxZone: { id: number }) => taxZone.id === 1);
    if (defaultTaxZone) {
      const { rates = [] } = defaultTaxZone;

      if (rates[0] && rates[0].enabled && rates[0].classRates.length) {
        rates[0].classRates.forEach((rate) => classRates.push(rate));
      }
    }
  }

  const getTaxRate = (taxClassId: number, variants: any) => {
    if (variants.length) {
      const taxExclusive = get(variants, '[0].bc_calculated_price.tax_exclusive', 0);
      const taxInclusive = get(variants, '[0].bc_calculated_price.tax_inclusive', 0);
      return taxExclusive > 0 ? (taxInclusive - taxExclusive) / taxExclusive : 0;
    }
    if (classRates.length) {
      return (classRates.find((rate) => rate.taxClassId === taxClassId)?.rate || 0) / 100;
    }
    return 0;
  };

  const getQuoteExtraFields = async (currentExtraFields: QuoteExtraFieldsData[]) => {
    const extraFieldsInfo = await getB2BQuoteExtraFields();
    const quoteCurrentExtraFields: QuoteExtraFieldsData[] = [];
    if (extraFieldsInfo.length) {
      extraFieldsInfo.forEach((item) => {
        const extraField = item;
        const currentExtraField = currentExtraFields.find(
          (field: QuoteExtraFieldsData) => field.fieldName === extraField.name,
        );

        quoteCurrentExtraFields.push({
          fieldName: extraField.name || '',
          fieldValue: currentExtraField?.fieldValue || extraField.default,
        });
      });
    }

    return quoteCurrentExtraFields;
  };

  const getQuoteDetail = async () => {
    setIsRequestLoading(true);
    setIsShowFooter(false);

    try {
      const quote = await getQuote();
      const productsWithMoreInfo = await handleGetProductsById(quote.productsList).catch(() => {
        return undefined;
      });
      const quoteExtraFieldInfos = await getQuoteExtraFields(quote.extraFields);

      setQuoteDetail({
        ...quote,
        extraFields: quoteExtraFieldInfos,
      });
      setQuoteSummary({
        originalSubtotal: quote.subtotal,
        discount: quote.discount,
        tax: quote.taxTotal,
        shipping: quote.shippingTotal,
        totalAmount: quote.totalAmount,
      });
      setProductList(productsWithMoreInfo ?? []);

      if (Number(quote.shippingTotal) === 0) {
        setQuoteDetailTax(Number(quote.taxTotal));
      } else {
        let taxPrice = 0;
        productsWithMoreInfo?.forEach((product) => {
          const {
            quantity,
            offeredPrice,
            productsSearch: { variants = [], taxClassId },
          } = product;

          const taxRate = getTaxRate(taxClassId, variants);
          taxPrice += enteredInclusiveTax
            ? ((Number(offeredPrice) * taxRate) / (1 + taxRate)) * Number(quantity)
            : Number(offeredPrice) * taxRate * Number(quantity);
        });

        setQuoteDetailTax(taxPrice);
      }

      const {
        backendAttachFiles = [],
        storefrontAttachFiles = [],
        salesRep,
        salesRepEmail,
      } = quote;

      setQuoteWasReviewedBySalesRep(!!salesRep || !!salesRepEmail);

      const newFileList: FileObjects[] = [];
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
        });
      });

      backendAttachFiles.forEach((file: CustomFieldItems) => {
        newFileList.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          id: file.id,
          title: b3Lang('quoteDetail.uploadedBySalesRep', {
            createdBy: file.createdBy,
          }),
        });
      });

      setFileList(newFileList);

      return quote;
    } catch (error: unknown) {
      if (error instanceof Error) {
        snackbar.error(error.message);
      }
      throw error;
    } finally {
      setIsRequestLoading(false);
      setIsShowFooter(true);
    }
  };

  const fetchPdfUrl = async (bool: boolean) => {
    setIsRequestLoading(true);
    const { id, createdAt } = quoteDetail;
    try {
      const data = {
        quoteId: Number(id),
        createdAt,
        isPreview: bool,
        lang: bcLanguage,
      };

      const quotePdf = await exportQuotePdf(data);

      if (quotePdf) {
        return {
          url: quotePdf.quoteFrontendPdf.url,
          content: quotePdf.quoteFrontendPdf.content,
        };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        snackbar.error(error.message);
      }
    }
    return {
      url: '',
      content: '',
    };
  };

  const exportPdf = async () => {
    try {
      const { url: quotePdfUrl } = await fetchPdfUrl(false);
      if (quotePdfUrl) {
        window.open(`${quotePdfUrl}`, '_blank');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        snackbar.error(error.message);
      }
    } finally {
      setIsRequestLoading(false);
    }
  };

  const printQuote = async () => {
    try {
      const { content } = await fetchPdfUrl(true);

      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'display:none;');
      document.getElementById('bundle-container')?.appendChild(iframe);
      iframe.contentDocument?.open();
      iframe.contentDocument?.write(content);
      iframe.contentDocument?.close();
      setIsRequestLoading(false);
      iframe.contentWindow?.print();
    } catch (error: unknown) {
      if (error instanceof Error) {
        snackbar.error(error.message);
      }
    }
  };

  const getQuoteTableDetails = async (params: any) => {
    let allProductsList = productList;

    if (allProductsList.length === 0) {
      const quote = await getQuoteDetail();
      allProductsList = quote?.productsList || [];
    }

    const startIndex = Number(params.offset);
    const endIndex = Number(params.first) + startIndex;

    if (!allProductsList.length) {
      return {
        edges: [],
        totalCount: 0,
      };
    }
    const list = allProductsList.slice(startIndex, endIndex);

    return {
      edges: list,
      totalCount: allProductsList.length,
    };
  };

  useEffect(() => {
    const { state } = location;

    if (!state) return;

    setTimeout(() => {
      snackbar.success(
        Number(role) === 100
          ? b3Lang('quoteDetail.submittedQuote')
          : b3Lang('quoteDetail.quoteSubmitted'),
        {
          action: {
            label:
              Number(role) === 100
                ? b3Lang('quoteDetail.copyQuoteLink')
                : b3Lang('quoteDetail.reviewAllQuotes'),
            onClick: () => {
              if (Number(role) === 100) {
                copy(window.location.href);
                snackbar.success(b3Lang('quoteDetail.copySuccessful'));
              } else {
                navigate('/quotes');
              }
            },
          },
        },
      );
    }, 10);
    location.state = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate, role]);

  const quoteGotoCheckout = async () => {
    try {
      if (hasQuoteValidationErrors()) return;
      setQuoteCheckoutLoading(true);
      await handleQuoteCheckout({
        quoteId: id,
        role,
        location,
        navigate,
      });
    } finally {
      setQuoteCheckoutLoading(false);
    }
  };
  useEffect(() => {
    if (location.search.includes('isCheckout') && id) {
      quoteGotoCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isHideQuoteCheckout]);

  const isAutoEnableQuoteCheckout = useMemo(() => {
    if (!isAutoQuotingEnabled && !quoteReviewedBySalesRep) return false;

    return true;
  }, [quoteReviewedBySalesRep, isAutoQuotingEnabled]);

  const isEnableProductShowCheckoutFrontendFlow = () => {
    if (isEnableProduct) {
      if (quoteReviewedBySalesRep && isHideQuoteCheckout) return true;
      if (!isHideQuoteCheckout) return true;

      return false;
    }

    return true;
  };

  const isEnableProductShowCheckoutBackendFlow = () => {
    return !quoteHasWarnings || quoteReviewedBySalesRep;
  };

  const enableProceedToCheckoutButton = isMoveStockAndBackorderValidationToBackend
    ? isEnableProductShowCheckoutBackendFlow
    : isEnableProductShowCheckoutFrontendFlow;

  const quoteAndExtraFieldsInfo = useMemo(() => {
    const currentExtraFields = quoteDetail?.extraFields?.map(
      (field: { fieldName: string; fieldValue: string | number }) => ({
        fieldName: field.fieldName,
        value: field.fieldValue,
      }),
    );

    return {
      info: {
        quoteTitle: quoteDetail?.quoteTitle || '',
        referenceNumber: quoteDetail?.referenceNumber || '',
      },
      extraFields: currentExtraFields || [],
      recipients: quoteDetail?.recipients || [],
    };
  }, [quoteDetail]);

  useScrollBar(false);

  const { quotePurchasabilityPermission, quoteConvertToOrderPermission } =
    quotePurchasabilityPermissionInfo;

  const shouldHidePrice = isMoveStockAndBackorderValidationToBackend
    ? shouldHidePrices
    : isHideQuoteCheckout;

  return (
    <B3Spin isSpinning={isRequestLoading || quoteCheckoutLoading}>
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
          salesRepInfo={quoteDetail.salesRepInfo}
        />

        <Box
          sx={{
            marginTop: '1rem',
          }}
        >
          <QuoteInfo
            quoteAndExtraFieldsInfo={quoteAndExtraFieldsInfo}
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
            marginTop: isMobile ? 0 : '1rem',
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
                quoteReviewedBySalesRep={quoteReviewedBySalesRep}
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
                shouldHidePrice={shouldHidePrice}
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
                allowUpload={Number(quoteDetail.status) !== 4}
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
                <QuoteTermsAndConditions quoteLegalTerms={quoteDetail.legalTerms} />
              </Box>
            )}
          </Grid>
        </Grid>

        {quoteConvertToOrderPermission &&
          quotePurchasabilityPermission &&
          Number(quoteDetail.status) !== 4 &&
          Number(quoteDetail.status) !== 5 &&
          isShowFooter &&
          quoteDetail?.allowCheckout &&
          isAutoEnableQuoteCheckout &&
          enableProceedToCheckoutButton() && (
            <Footer isAgenting={isAgenting}>
              <ProceedToCheckoutButton
                onClick={() => {
                  if (hasQuoteValidationErrors()) return;
                  handleQuoteCheckout({
                    role,
                    location,
                    quoteId: quoteDetail.id,
                    navigate,
                  });
                }}
              >
                {b3Lang('quoteDetail.footer.proceedToCheckout')}
              </ProceedToCheckoutButton>
            </Footer>
          )}
      </Box>
    </B3Spin>
  );
}

export default QuoteDetail;
