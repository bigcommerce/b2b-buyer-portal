interface CompanyStatusMapping {
  message: string;
  key: string;
  flag: string;
}

const COMPANY_STATUS_MAPPINGS: CompanyStatusMapping[] = [
  {
    message:
      'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
    key: 'global.statusNotifications.willGainAccessToBusinessFeatProductsAndPricingAfterApproval',
    flag: 'companyNeedPricingApproval',
  },
  {
    message:
      'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.',
    key: 'global.statusNotifications.productsPricingAndOrderingWillBeEnabledAfterApproval',
    flag: 'companyNeedOrderApproval',
  },
  {
    message:
      'Your business account is pending approval. You will gain access to business account features after account approval.',
    key: 'global.statusNotifications.willGainAccessToBusinessFeatAfterApproval',
    flag: 'companyNeedApproval',
  },
  {
    message:
      'This business account is inactive. Reach out to our support team to reactivate your account.',
    key: 'global.statusNotifications.businessAccountInactive',
    flag: 'companyInactive',
  },
];

export const getFlagByMessage = (message: string): string | undefined => {
  const mapping = COMPANY_STATUS_MAPPINGS.find((item) => item.message === message);
  return mapping?.flag;
};

export const getTranslationKeyByMessage = (message: string): string | undefined => {
  const mapping = COMPANY_STATUS_MAPPINGS.find((item) => item.message === message);
  return mapping?.key;
};

export const getTranslationKeyByFlag = (flag: string): string | undefined => {
  const mapping = COMPANY_STATUS_MAPPINGS.find((item) => item.flag === flag);
  return mapping?.key;
};
