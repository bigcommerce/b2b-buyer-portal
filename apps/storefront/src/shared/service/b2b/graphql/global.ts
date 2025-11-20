import { CompanyHierarchyListProps, ConfigsSwitchStatusProps } from '@/types';
import { storeHash } from '@/utils/basicConfig';
import {
  convertArrayToGraphql,
  convertObjectOrArrayKeysToCamel,
  convertObjectOrArrayKeysToSnake,
} from '@/utils/graphqlDataConvert';

import B3Request from '../../request/b3Fetch';

interface ProductPriceOption {
  option_id: number;
  value_id: number;
}

interface ProductPriceItem {
  product_id: number;
  variant_id: number;
  options: Partial<ProductPriceOption>[];
}

interface ProductPrice {
  storeHash: string;
  channel_id: number;
  currency_code: string;
  items: Partial<ProductPriceItem>[];
  customer_group_id: number;
}

interface CompanySubsidiariesProps {
  companySubsidiaries: CompanyHierarchyListProps[];
}

interface ConfigsSwitchStatus {
  storeConfigSwitchStatus: ConfigsSwitchStatusProps;
}
const getB2BTokenQl = (currentCustomerJWT: string, channelId: number) => `mutation {
	authorization(authData: {
		bcToken: "${currentCustomerJWT}"
		channelId: ${channelId}
	}) {
		result {
			token
			loginType
			permissions {
				code
				permissionLevel
			}
		}
	}
}`;

export interface AgentInfo {
  data: {
    superAdminMasquerading: {
      companyName: string;
      bcGroupName: string;
      customerGroupId: number;
      companyStatus: number;
      id: string;
    };
  };
}

const getAgentInfoQl = (customerId: string | number) => `
query AgentInfo {
	superAdminMasquerading(customerId: ${customerId}) {
		companyName,
		bcGroupName,
		customerGroupId,
		companyStatus,
		id
	}
}`;

export interface CompanyEdge {
  node: {
    companyId: number;
    id: string;
    companyName: string;
    companyEmail: string;
  };
}

export interface Company {
  data: {
    superAdminCompanies: {
      edges: CompanyEdge[];
      totalCount: number;
    };
  };
}

const superAdminCompaniesQl = (id: number, params: CustomFieldItems) => `
query SuperAdminCompanies {
	superAdminCompanies(
		superAdminId: ${id}
		first: ${params.first}
		offset: ${params.offset}
		search: "${params.q || ''}"
		orderBy: "${params.orderBy}"
	) {
		edges{
			node{
				companyId,
				id,
				companyName,
				companyEmail,
			}
		},
		totalCount
	}
}`;

const superAdminBeginMasqueradeQl = (companyId: number) => `
mutation BeginMasquerade {
	superAdminBeginMasquerade(
		companyId: ${companyId}
	) {
		userInfo {
			email,
			phoneNumber,
		}
	}
}`;

const superAdminEndMasqueradeQl = (companyId: number) => `
mutation EndMasquerade {
	superAdminEndMasquerade(
		companyId: ${companyId}
	) {
		message
	}
}`;

const userCompanyQl = (userId: number) => `{
	userCompany(
		userId: ${userId}
	) {
		companyName,
		companyStatus,
		id,
	}
}`;

const storefrontConfig = () => `{
	storefrontConfig(
		storeHash: "${storeHash}"
	) {
		config{
			accountSettings,
			addressBook,
			buyAgain,
			dashboard,
			invoice{
				enabledStatus,
				value,
			},
			messages,
			orders,
			quickOrderPad,
			quotes,
			recentlyViewed,
			returns,
			shoppingLists,
			tradeProfessionalApplication,
			userManagement,
			wishLists,
		}
		configId,
	}
}`;

const storefrontConfigWithCompanyHierarchy = () => `
query storefrontConfigWithCompanyHierarchy($includeCompanyHierarchy: Boolean!) {
	storefrontConfig(
		storeHash: "${storeHash}"
	) {
		config{
			accountSettings,
			addressBook,
			buyAgain,
			dashboard,
			invoice{
				enabledStatus,
				value,
			},
			messages,
			orders,
			quickOrderPad,
			quotes,
			recentlyViewed,
			returns,
			shoppingLists,
			tradeProfessionalApplication,
			userManagement,
			wishLists,
		}
		configId,
	}
	companySubsidiaries @include(if: $includeCompanyHierarchy) {
		companyId
		companyName
		parentCompanyId
		parentCompanyName
		channelFlag
	}
	userMasqueradingCompany @include(if: $includeCompanyHierarchy) {
		companyId
		companyName
		bcId
	}
}`;

const currencies = (channelId: string | number) => `{
	currencies(
		storeHash: "${storeHash}",
		channelId: "${channelId}",
	) {
		currencies {
			id,
			is_default,
			last_updated,
			country_iso2,
			default_for_country_codes,
			currency_code,
			currency_exchange_rate,
			name,
			token,
			auto_update,
			decimal_token,
			decimal_places,
			enabled,
			is_transactional,
			token_location,
			thousands_token,
		},
		channelCurrencies,
		enteredInclusiveTax,
	}
}`;

const storefrontConfigs = (channelId: number, keys: string[]) => `{
	storefrontConfigs(
		storeHash: "${storeHash}",
		channelId: ${channelId},
		keys: ${convertArrayToGraphql(keys)}
	) {
		key,
		value,
		extraFields,
	}
}`;

const taxZoneRates = () => `
query TaxZoneRates {
	taxZoneRates(storeHash: "${storeHash}") {
		rates {
			id,
			name,
			enabled,
			priority,
			classRates {
				rate,
				taxClassId,
			}
		},
		priceDisplaySettings {
			showInclusive,
			showBothOnDetailView,
			showBothOnListView,
		},
		enabled,
		id,
		name,
	}
}`;

const storefrontDefaultLanguage = (channelId: number) => `{
	storefrontDefaultLanguage(storeHash: "${storeHash}", channelId: ${channelId}) {
		language,
	}
}`;

const companyCreditConfig = () => `{
	companyCreditConfig{
    limitPurchases
    creditCurrency
    creditHold
    creditEnabled
    availableCredit
    currency
  }
}`;

interface BulkPricing {
  minimum: number;
  maximum: number | null;
  discountAmount: number;
  discountType: string;
  taxDiscountAmount: null;
}

interface CalculatedPrice {
  asEntered: number;
  enteredInclusive: boolean;
  taxExclusive: number;
  taxInclusive: number;
}

interface PriceRange {
  minimum: CalculatedPrice;
  maximum: CalculatedPrice;
}

interface ReferenceRequest {
  productId: number;
  variantId: number;
  options: null;
}

interface PriceProduct {
  productId: number;
  variantId: number;
  options: any[];
  referenceRequest: ReferenceRequest;
  retailPrice: null;
  salePrice: null;
  minimumAdvertisedPrice: null;
  saved: null;
  price: CalculatedPrice;
  calculatedPrice: CalculatedPrice;
  priceRange: PriceRange;
  retailPriceRange: null;
  bulkPricing: BulkPricing[];
}

export interface PriceProductsResponse {
  data: {
    priceProducts: PriceProduct[];
  };
}

const priceProducts = `query priceProducts($storeHash: String, $channelId: Int, $currencyCode: String!, $customerGroupId: Int, $items: [PricingProductItemInputType]!) {
  priceProducts(
		storeHash: $storeHash,
		channelId: $channelId,
		currencyCode: $currencyCode,
		customerGroupId: $customerGroupId,
		items: $items
	) {
    productId
		variantId
		options{
				optionId
				valueId
		}
		referenceRequest{
				productId
				variantId
				options{
						optionId
						valueId
				}
		}
		retailPrice{
				asEntered
				enteredInclusive
				taxExclusive
				taxInclusive
		}
		salePrice{
				asEntered
				enteredInclusive
				taxExclusive
				taxInclusive
		}
		minimumAdvertisedPrice{
				asEntered
				enteredInclusive
				taxExclusive
				taxInclusive
		}
		saved{
				asEntered
				enteredInclusive
				taxExclusive
				taxInclusive
		}
		price{
				asEntered
				enteredInclusive
				taxExclusive
				taxInclusive
		}
		calculatedPrice{
				asEntered
				enteredInclusive
				taxExclusive
				taxInclusive
		}
		priceRange{
				minimum{
						asEntered
						enteredInclusive
						taxExclusive
						taxInclusive
				}
				maximum{
						asEntered
						enteredInclusive
						taxExclusive
						taxInclusive
				}
		}
		retailPriceRange{
				minimum{
						asEntered
						enteredInclusive
						taxExclusive
						taxInclusive
				}
				maximum{
						asEntered
						enteredInclusive
						taxExclusive
						taxInclusive
				}
		}
		bulkPricing{
				minimum
				maximum
				discountAmount
				discountType
				taxDiscountAmount{
						asEntered
						enteredInclusive
						taxExclusive
						taxInclusive
				}
		}
  }
}
`;

const companySubsidiaries = `query CompanySubsidiaries {
	companySubsidiaries {
		companyId
		companyName
		parentCompanyId
		parentCompanyName
		channelFlag
	}
}`;

const userMasqueradingCompanyBegin = `mutation userMasqueradingCompanyBegin($companyId: Int!) {
	userMasqueradingCompanyBegin(companyId: $companyId) {
		userMasqueradingCompanyBegin{
			companyId
			companyName
			bcId
		}
	}
}`;

const userMasqueradingCompanyEnd = `mutation userMasqueradingCompanyEnd {
	userMasqueradingCompanyEnd {
		message
	}
}`;

const userMasqueradingCompany = `query {
	userMasqueradingCompany {
		companyId
		companyName
		bcId
	}
}`;

const storeConfigSwitchStatus = `query storeConfigSwitchStatus($key: String!){
	storeConfigSwitchStatus(
		key: $key,
	) {
		id,
		key,
		isEnabled,
	}
}`;

export const getB2BToken = (currentCustomerJWT: string, channelId = 1) =>
  B3Request.graphqlB2B({
    query: getB2BTokenQl(currentCustomerJWT, channelId),
  });

export const getAgentInfo = (customerId: string | number) =>
  B3Request.graphqlB2B({
    query: getAgentInfoQl(customerId),
  });

export const superAdminCompanies = (id: number, params: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: superAdminCompaniesQl(id, params),
  });

export const superAdminBeginMasquerade = (companyId: number) =>
  B3Request.graphqlB2B({
    query: superAdminBeginMasqueradeQl(companyId),
  });

export const superAdminEndMasquerade = (companyId: number) =>
  B3Request.graphqlB2B({
    query: superAdminEndMasqueradeQl(companyId),
  });

export const getUserCompany = (userId: number) =>
  B3Request.graphqlB2B({
    query: userCompanyQl(userId),
  });

export const getStorefrontConfig = () =>
  B3Request.graphqlB2B({
    query: storefrontConfig(),
  });

export const getStorefrontConfigWithCompanyHierarchy = (includeCompanyHierarchy = false) =>
  B3Request.graphqlB2B({
    query: storefrontConfigWithCompanyHierarchy(),
    variables: { includeCompanyHierarchy },
  });

export const getCurrencies = (channelId: string | number) =>
  B3Request.graphqlB2B({
    query: currencies(channelId),
  });

export const getStorefrontConfigs = (channelId: number, keys: string[]) =>
  B3Request.graphqlB2B({
    query: storefrontConfigs(channelId, keys),
  });

export const getTaxZoneRates = () =>
  B3Request.graphqlB2B({
    query: taxZoneRates(),
  });

export const getStorefrontDefaultLanguages = (channelId: number) =>
  B3Request.graphqlB2B({
    query: storefrontDefaultLanguage(channelId),
  });

export const getCompanyCreditConfig = () =>
  B3Request.graphqlB2B({
    query: companyCreditConfig(),
  });

export const getProductPricing = (data: Partial<ProductPrice>) =>
  B3Request.graphqlB2B({
    query: priceProducts,
    variables: convertObjectOrArrayKeysToCamel(data),
  }).then((res) => {
    const { priceProducts: b2bPriceProducts = [] } = res;
    return {
      data: convertObjectOrArrayKeysToSnake(b2bPriceProducts) as CustomFieldItems[],
    };
  });

export const getCompanySubsidiaries = (): Promise<CompanySubsidiariesProps> =>
  B3Request.graphqlB2B({
    query: companySubsidiaries,
  });

export const startUserMasqueradingCompany = (companyId: number) =>
  B3Request.graphqlB2B({
    query: userMasqueradingCompanyBegin,
    variables: { companyId },
  });

export const endUserMasqueradingCompany = () =>
  B3Request.graphqlB2B({
    query: userMasqueradingCompanyEnd,
  });

export const getUserMasqueradingCompany = () =>
  B3Request.graphqlB2B({
    query: userMasqueradingCompany,
  });

export const getStoreConfigsSwitchStatus = (key: string): Promise<ConfigsSwitchStatus> =>
  B3Request.graphqlB2B({
    query: storeConfigSwitchStatus,
    variables: { key },
  });
