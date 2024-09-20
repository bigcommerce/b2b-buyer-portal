import { useContext, useEffect, useRef } from 'react';
import { useB3Lang } from '@b3/lang';
import Cookies from 'js-cookie';

import { HeadlessRoutes } from '@/constants';
import { addProductFromPage as addProductFromPageToShoppingList } from '@/hooks/dom/useOpenPDP';
import { addProductsFromCartToQuote, addProductsToDraftQuote } from '@/hooks/dom/utils';
import { addProductsToShoppingList } from '@/pages/PDP';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobaledContext } from '@/shared/global';
import { superAdminCompanies } from '@/shared/service/b2b';
import B3Request from '@/shared/service/request/b3Fetch';
import {
  formattedQuoteDraftListSelector,
  isB2BUserSelector,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { QuoteItem } from '@/types/quotes';
import CallbackManager from '@/utils/b3Callbacks';
import { LineItems } from '@/utils/b3Product/b3Product';
import createShoppingList from '@/utils/b3ShoppingList/b3ShoppingList';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';
import { endMasquerade, startMasquerade } from '@/utils/masquerade';

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

const transformOptionSelectionsToAttributes = (items: LineItems[]) =>
  items.map((product) => {
    const { selectedOptions } = product;

    return {
      ...product,
      selectedOptions: selectedOptions?.reduce(
        (accumulator: Record<string, number>, { optionEntityId, optionValueEntityId }) => {
          accumulator[`attribute[${optionEntityId}]`] = optionValueEntityId;

          return accumulator;
        },
        {},
      ),
    };
  });

export type ProductMappedAttributes = ReturnType<typeof transformOptionSelectionsToAttributes>;

export default function HeadlessController({ setOpenPage }: HeadlessControllerProps) {
  const storeDispatch = useAppDispatch();
  const b3Lang = useB3Lang();

  const {
    state: { registerEnabled, productQuoteEnabled, cartQuoteEnabled, shoppingListEnabled },
  } = useContext(GlobaledContext);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const customer = useAppSelector(({ company }) => company.customer);
  const role = useAppSelector(({ company }) => company.customer.role);
  const productList = useAppSelector(formattedQuoteDraftListSelector);
  const B2BToken = useAppSelector(({ company }) => company.tokens.B2BToken);

  const {
    state: { addQuoteBtn, shoppingListBtn, addToAllQuoteBtn },
  } = useContext(CustomStyleContext);
  const { addToQuote: addProductsFromCart } = addProductsFromCartToQuote(setOpenPage);

  const saveFn = () => {
    setOpenPage({
      isOpen: true,
      openUrl: '/register',
    });
  };
  const gotoShoppingDetail = (id: number | string) => {
    setOpenPage({
      isOpen: true,
      openUrl: `/shoppingList/${id}`,
      params: {
        shoppingListBtn: 'add',
      },
    });
  };

  const customerId = customer.id;
  // Keep updated values
  const salesRepCompanyIdRef = useRef(+salesRepCompanyId);
  const customerIdRef = useRef(customerId);
  const customerRef = useRef(customer);
  const roleRef = useRef(+role);
  const isB2BUserRef = useRef(isB2BUser);
  const productQuoteEnabledRef = useRef(productQuoteEnabled);
  const shoppingListEnabledRef = useRef(shoppingListEnabled);
  const cartQuoteEnabledRef = useRef(cartQuoteEnabled);
  const addQuoteBtnRef = useRef(addQuoteBtn);
  const shoppingListBtnRef = useRef(shoppingListBtn);
  const addToAllQuoteBtnRef = useRef(addToAllQuoteBtn);

  salesRepCompanyIdRef.current = +salesRepCompanyId;
  customerIdRef.current = customerId;
  customerRef.current = customer;
  roleRef.current = +role;
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
      callbacks: new CallbackManager(),
      utils: {
        openPage: (page) =>
          setTimeout(() => {
            if (page === 'CLOSE') {
              setOpenPage({ isOpen: false });
              return;
            }
            setOpenPage({ isOpen: true, openUrl: HeadlessRoutes[page] });
          }, 0),
        quote: {
          addProductFromPage: (item) => addProductsToDraftQuote([item], setOpenPage),
          addProductsFromCart: () => addProductsFromCart(),
          addProducts: (items) => addProductsToDraftQuote(items, setOpenPage),
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
              orderBy: 'companyId',
            });

            return {
              current_company_id: salesRepCompanyIdRef.current,
              companies: companies.map(({ node }: { node: CustomFieldStringItems }) => node),
            };
          },
          getB2BToken: () => B2BToken,
          setMasqueradeCompany: (companyId) => {
            if (typeof customerRef.current.b2bId !== 'number') return;
            startMasquerade({
              companyId,
              b2bId: customerRef.current.b2bId,
              customerId: customerIdRef.current,
            });
          },
          endMasquerade: () => {
            if (typeof customerRef.current.b2bId !== 'number') return;
            endMasquerade({
              b2bId: customerRef.current.b2bId,
            });
          },
          graphqlBCProxy: B3Request.graphqlBCProxy,
          loginWithB2BStorefrontToken: async (b2bStorefrontJWTToken: string) => {
            storeDispatch(setB2BToken(b2bStorefrontJWTToken));
            await getCurrentCustomerInfo(b2bStorefrontJWTToken);
          },
        },
        shoppingList: {
          itemFromCurrentPage: [],
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
              gotoShoppingDetail,
              b3Lang,
            }),
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
        },
        cart: {
          setEntityId: (entityId) => {
            Cookies.set('cartId', entityId);
          },
          getEntityId: () => Cookies.get('cartId'),
        },
      },
    };
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productList, B2BToken]);

  return null;
}
