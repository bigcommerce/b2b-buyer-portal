import { setElementsListenersConfig } from '@b3/global-b3';
import { useB3Lang } from '@b3/lang';
import Cookies from 'js-cookie';
import { useContext, useEffect, useRef } from 'react';

import { HeadlessRoutes } from '@/constants';
import { addProductFromPage as addProductFromPageToShoppingList } from '@/hooks/dom/useOpenPDP';
import { addProductsFromCartToQuote, addProductsToDraftQuote } from '@/hooks/dom/utils';
import {
  addProductsToShoppingList,
  addProductsToShoppingListErrorHandler,
  useAddedToShoppingListAlert,
} from '@/pages/PDP';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { ShoppingListsItemsProps } from '@/pages/ShoppingLists/config';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { getAllowedRoutesWithoutComponent } from '@/shared/routeList';
import { getB2BShoppingList, getBcShoppingList, superAdminCompanies } from '@/shared/service/b2b';
import B3Request from '@/shared/service/request/b3Fetch';
import {
  formattedQuoteDraftListSelector,
  isB2BUserSelector,
  useAppDispatch,
  useAppSelector,
  useAppStore,
} from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { QuoteItem } from '@/types/quotes';
import { channelId } from '@/utils';
import CallbackManager from '@/utils/b3CallbackManager';
import b2bLogger from '@/utils/b3Logger';
import { logoutSession } from '@/utils/b3logout';
import { LineItem } from '@/utils/b3Product/b3Product';
import createShoppingList from '@/utils/b3ShoppingList/b3ShoppingList';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';
import { endMasquerade, startMasquerade } from '@/utils/masquerade';

import { getSku } from './getSku';

export interface FormattedQuoteItem
  extends Omit<QuoteItem['node'], 'optionList' | 'calculatedValue' | 'productsSearch'> {
  optionSelections: {
    optionId: string | number;
    optionValue: number;
  }[];
}

interface HeadlessControllerProps {
  setOpenPage: SetOpenPage;
}

const transformOptionSelectionsToAttributes = (items: LineItem[]) =>
  items.map((product) => {
    const selectedOptions =
      product.selectedOptions?.reduce(
        (accumulator: Record<string, number>, { optionEntityId, optionValueEntityId }) => {
          accumulator[`attribute[${optionEntityId}]`] = optionValueEntityId;

          return accumulator;
        },
        {},
      ) ?? {};

    return {
      ...product,
      productId: product.productEntityId,
      selectedOptions,
      optionSelections: selectedOptions,
    };
  });

export type ProductMappedAttributes = ReturnType<typeof transformOptionSelectionsToAttributes>;

const Manager = new CallbackManager();

export default function HeadlessController({ setOpenPage }: HeadlessControllerProps) {
  const storeDispatch = useAppDispatch();
  const store = useAppStore();
  const b3Lang = useB3Lang();

  const { state: globalState } = useContext(GlobalContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const customer = useAppSelector(({ company }) => company.customer);
  const role = useAppSelector(({ company }) => company.customer.role);
  const productList = useAppSelector(formattedQuoteDraftListSelector);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const B2BToken = useAppSelector(({ company }) => company.tokens.B2BToken);

  const displayAddedToShoppingListAlert = useAddedToShoppingListAlert();

  const {
    state: { addQuoteBtn, shoppingListBtn, addToAllQuoteBtn },
  } = useContext(CustomStyleContext);
  const { addToQuoteFromCart, addToQuoteFromCookie } = addProductsFromCartToQuote(
    setOpenPage,
    b3Lang,
  );

  const {
    registerEnabled,
    productQuoteEnabled,
    cartQuoteEnabled,
    shoppingListEnabled,
    quoteConfig,
  } = globalState;

  const saveFn = () => {
    setOpenPage({
      isOpen: true,
      openUrl: '/register',
    });
  };

  const customerId = customer.id;
  // Keep updated values
  const salesRepCompanyIdRef = useRef(Number(salesRepCompanyId));
  const customerIdRef = useRef(customerId);
  const customerRef = useRef(customer);
  const roleRef = useRef(Number(role));
  const isB2BUserRef = useRef(isB2BUser);
  const productQuoteEnabledRef = useRef(productQuoteEnabled);
  const shoppingListEnabledRef = useRef(shoppingListEnabled);
  const cartQuoteEnabledRef = useRef(cartQuoteEnabled);
  const addQuoteBtnRef = useRef(addQuoteBtn);
  const shoppingListBtnRef = useRef(shoppingListBtn);
  const addToAllQuoteBtnRef = useRef(addToAllQuoteBtn);

  salesRepCompanyIdRef.current = Number(salesRepCompanyId);
  customerIdRef.current = customerId;
  customerRef.current = customer;
  roleRef.current = Number(role);
  isB2BUserRef.current = isB2BUser;
  productQuoteEnabledRef.current = productQuoteEnabled;
  shoppingListEnabledRef.current = shoppingListEnabled;
  cartQuoteEnabledRef.current = cartQuoteEnabled;
  addQuoteBtnRef.current = addQuoteBtn;
  shoppingListBtnRef.current = shoppingListBtn;
  addToAllQuoteBtnRef.current = addToAllQuoteBtn;

  useEffect(() => {
    window.b2b = {
      ...window.b2b,
      callbacks: Manager,
      utils: {
        getRoutes: () => getAllowedRoutesWithoutComponent(globalState),
        openPage: (page) =>
          setTimeout(() => {
            if (page === 'CLOSE') {
              setOpenPage({ isOpen: false });

              return;
            }

            const openUrl = page.startsWith('/') ? page : HeadlessRoutes[page];

            setOpenPage({ isOpen: true, openUrl });
          }, 0),
        setConfig: (key: string, value: string) => {
          setElementsListenersConfig(key, value);
        },
        quote: {
          addProductFromPage: async (item) => {
            const productWithSku = {
              ...item,
              sku: await getSku(item),
            };

            return addProductsToDraftQuote([productWithSku], setOpenPage, b3Lang);
          },
          addProductsFromCart: addToQuoteFromCookie,
          addProductsFromCartId: addToQuoteFromCart,
          addProducts: async (items: LineItem[]) => {
            const products = await Promise.all(
              items.map(async (item) => ({
                ...item,
                sku: await getSku(item),
              })),
            );

            return addProductsToDraftQuote(products, setOpenPage, b3Lang);
          },
          getQuoteConfigs: () => quoteConfig,
          getCurrent: () => ({ productList }),
          getButtonInfo: () => ({
            ...addQuoteBtnRef.current,
            enabled: productQuoteEnabledRef.current,
          }),
          getButtonInfoAddAllFromCartToQuote: () => ({
            ...addToAllQuoteBtnRef.current,
            enabled: cartQuoteEnabledRef.current,
          }),
        },
        user: {
          getProfile: () => ({ ...customerRef.current, role }),
          getMasqueradeState: async () => {
            if (typeof customerRef.current.b2bId !== 'number') {
              return {
                current_company_id: salesRepCompanyIdRef.current,
                companies: [],
              };
            }

            // get companies list
            const {
              superAdminCompanies: { edges: companies = [] },
            } = await superAdminCompanies(customerRef.current.b2bId, {
              first: 50,
              offset: 0,
              orderBy: 'companyName',
            });

            return {
              current_company_id: salesRepCompanyIdRef.current,
              companies: companies.map(({ node }: { node: CustomFieldStringItems }) => node),
            };
          },
          getB2BToken: () => B2BToken,
          setMasqueradeCompany: (companyId) => {
            if (typeof customerRef.current.b2bId !== 'number') return;
            startMasquerade(
              {
                companyId,
                customerId: customerIdRef.current,
              },
              store,
            );
          },
          endMasquerade: () => {
            if (typeof customerRef.current.b2bId !== 'number') return;
            endMasquerade(store);
          },
          graphqlBCProxy: B3Request.graphqlBCProxy,
          loginWithB2BStorefrontToken: async (token: string) => {
            storeDispatch(setB2BToken(token));
            await getCurrentCustomerInfo(token);
          },
          logout: async () => {
            try {
              if (isAgenting) {
                await endMasquerade(store);
              }
            } catch (e) {
              b2bLogger.error(e);
            } finally {
              window.sessionStorage.clear();
              logoutSession();
              window.b2b.callbacks.dispatchEvent('on-logout');
            }
          },
        },
        shoppingList: {
          itemFromCurrentPage: window.b2b?.utils?.shoppingList?.itemFromCurrentPage ?? [],
          addProductFromPage: (item) => {
            window.b2b.utils.shoppingList.itemFromCurrentPage =
              transformOptionSelectionsToAttributes([item]);
            addProductFromPageToShoppingList({
              role: roleRef.current,
              storeDispatch,
              saveFn,
              setOpenPage,
              registerEnabled,
            });
          },
          addProducts: (shoppingListId, items) =>
            addProductsToShoppingList({
              shoppingListId,
              items: transformOptionSelectionsToAttributes(items),
              isB2BUser: isB2BUserRef.current,
              customerGroupId: customerRef.current.customerGroupId,
            })
              .then(() => displayAddedToShoppingListAlert(shoppingListId.toString()))
              .catch(addProductsToShoppingListErrorHandler),
          createNewShoppingList: async (name, description) => {
            const { shoppingListsCreate } = await createShoppingList({
              data: { name, description },
              isB2BUser: isB2BUserRef.current,
            });

            return shoppingListsCreate.shoppingList;
          },
          getButtonInfo: () => ({
            ...shoppingListBtnRef.current,
            enabled: shoppingListEnabledRef.current,
          }),
          getLists: async () => {
            const { edges: list = [] } = isB2BUser
              ? await getB2BShoppingList()
              : await getBcShoppingList({ channelId });

            return list.map(({ node }: { node: ShoppingListsItemsProps }) => node);
          },
        },
        cart: {
          setEntityId: (entityId) => {
            Cookies.set('cartId', entityId);
            b3TriggerCartNumber();
          },
          getEntityId: () => Cookies.get('cartId'),
        },
      },
    };
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productList, B2BToken, globalState, quoteConfig]);

  return null;
}
