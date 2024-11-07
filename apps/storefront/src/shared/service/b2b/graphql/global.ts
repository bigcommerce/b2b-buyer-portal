import { CompanyHierarchyListProps } from '@/types';
import {
  convertArrayToGraphql,
  convertObjectOrArrayKeysToCamel,
  convertObjectOrArrayKeysToSnake,
  storeHash,
} from '@/utils';

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

const getAgentInfoQl = (customerId: string | number) => `{
	superAdminMasquerading(customerId: ${customerId}) {
		companyName,
		bcGroupName,
		customerGroupId,
		companyStatus,
		id
	}
}`;

const superAdminCompaniesQl = (id: number, params: CustomFieldItems) => `{
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

const superAdminBeginMasqueradeQl = (companyId: string | number, userId: number) => `mutation {
	superAdminBeginMasquerade(
		companyId: ${companyId}
		userId: ${userId}
	) {
		userInfo {
			email,
			phoneNumber,
		}
	}
}`;

const superAdminEndMasqueradeQl = (companyId: string | number, userId: number) => `mutation {
	superAdminEndMasquerade(
		companyId: ${companyId}
		userId: ${userId}
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

// type storefrontConfigsProps = {
//   key: String,
//   value: String,
//   extraFields: any,
// }

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

const taxZoneRates = () => `{
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

const companySubsidiaries = `query {
	companySubsidiaries {
		companyId
		companyName
		parentCompanyId
		parentCompanyName
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

export const superAdminBeginMasquerade = (companyId: number, userId: number) =>
  B3Request.graphqlB2B({
    query: superAdminBeginMasqueradeQl(companyId, userId),
  });

export const superAdminEndMasquerade = (companyId: number, userId: number) =>
  B3Request.graphqlB2B({
    query: superAdminEndMasqueradeQl(companyId, userId),
  });

export const getUserCompany = (userId: number) =>
  B3Request.graphqlB2B({
    query: userCompanyQl(userId),
  });

export const getStorefrontConfig = () =>
  B3Request.graphqlB2B({
    query: storefrontConfig(),
  });

export const getCurrencies = (channelId: string | number) =>
  B3Request.graphqlB2B({
    query: currencies(channelId),
  });
export const getBcCurrencies = (channelId: string) =>
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
