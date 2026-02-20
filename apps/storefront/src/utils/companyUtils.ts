export type CompanyStatusKey =
  | 'pendingApprovalToViewPrices'
  | 'pendingApprovalToOrder'
  | 'pendingApprovalToAccessFeatures'
  | 'accountInactive';

interface CompanyStatusMapping {
  message: string;
  reason: CompanyStatusKey;
}
const COMPANY_STATUS_MESSAGE_MAPPINGS: Record<string, CompanyStatusKey> = {
  'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.':
    'pendingApprovalToViewPrices',
  'Your account is pending approval. Until your account is approved, you’ll have limited access to certain features.':
    'pendingApprovalToOrder',
  'Your business account is pending approval. You will gain access to business account features after account approval.':
    'pendingApprovalToAccessFeatures',
  'This business account is inactive. Reach out to our support team to reactivate your account.':
    'accountInactive',
};

export class CompanyError extends Error {
  readonly reason: CompanyStatusKey;

  constructor({ message, reason }: CompanyStatusMapping) {
    super(message);
    this.name = 'CompanyError';
    this.reason = reason;
  }
}

export const mapToCompanyError = (error: unknown) => {
  if (error instanceof Error) {
    const reason = COMPANY_STATUS_MESSAGE_MAPPINGS[error.message];
    if (reason) {
      throw new CompanyError({ message: error.message, reason });
    }
    throw error;
  }

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error);

  throw new Error(message);
};

export const isCompanyError = (error: unknown): error is CompanyError => {
  return error instanceof CompanyError;
};
