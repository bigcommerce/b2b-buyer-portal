import { PAGES_SUBSIDIARIES_PERMISSION_KEYS } from '@/constants';

export interface CompanyInfo {
  id: string;
  companyName: string;
  status: number;
}
export interface Customer {
  /**
   * The unique identifier of the customer provided by the BigCommerce backend API.
   */
  id: number;
  /**
   * The unique identifier of the customer provided by the B2B backend API.
   *
   * This is distinct from the `id` property.
   */
  b2bId?: number;
  userType: UserTypes;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  customerGroupId: number;
  loginType: LoginTypes;
  role: CustomerRole;
  companyRoleName: string;
}
// @Brian.Jiang2021: b5a4803db1bfe87cd85c9116e657d92d210335bd
// 99: default, Distinguish between bc and b2b;
// 0: pending; 1: approved; 2: rejected; 3: inactive; 4: deleted
export enum CompanyStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  INACTIVE = 3,
  DELETED = 4,
  DEFAULT = 99,
}

export enum CustomerRoleName {
  ADMIN_NAME = 'Admin',
  SENIOR_BUYER_NAME = 'Senior Buyer',
  JUNIOR_BUYER_NAME = 'Junior Buyer',
}

/** CUSTOM_ROLE(role === 2 && roleName !== 'Junior Buyer') * */
export enum CustomerRole {
  ADMIN = 0,
  SENIOR_BUYER = 1,
  JUNIOR_BUYER = 2,
  SUPER_ADMIN = 3,
  SUPER_ADMIN_BEFORE_AGENCY = 4,
  CUSTOM_ROLE = 5,
  B2C = 99,
  GUEST = 100,
}
// Per B2B GraphQL API, the userType is an enum that can be one of the following values:
/** 1: not exist; 2: exist in BC; 3: exist more than one in BC; 4: exist in B3 other company; 5: exist in B3 current company; 6: exist in B3 as super admin; 7: exist in B3 current company other channel; */
export enum UserTypes {
  DOESNT_EXIST = 1,
  B2C = 2,
  MULTIPLE_B2C = 3,
  OTHER_B2B_COMPANY = 4,
  CURRENT_B2B_COMPANY = 5,
  B2B_SUPER_ADMIN = 6,
  CURRENT_B2B_COMPANY_DIFFERENT_CHANNEL = 7,
}

export enum LoginTypes {
  WAITING_LOGIN = 0,
  FIRST_LOGIN = 1,
  GENERAL_LOGIN = 2,
}

export enum FeatureEnabled {
  DISABLED = '0',
  ENABLED = '1',
}

export enum B2BPermissionsLevel {
  USER = 1,
  COMPANY = 2,
  COMPANY_AND_SUBSIDIARIES = 3,
}

export interface CompanyHierarchyListProps {
  companyId: number;
  companyName: string;
  parentCompanyName?: string;
  parentCompanyId?: number | null;
  channelFlag: boolean;
}

export interface CompanyHierarchyInfoProps {
  isEnabledCompanyHierarchy: boolean;
  ishasCurrentPagePermission: boolean;
  selectCompanyHierarchyId: string | number;
  companyHierarchyList: CompanyHierarchyListProps[];
  companyHierarchyAllList: CompanyHierarchyListProps[];
}

export interface CompanyHierarchyProps extends CompanyHierarchyListProps {
  childs?: CompanyHierarchyProps[];
}

export type PagesSubsidiariesPermissionProps = Record<
  (typeof PAGES_SUBSIDIARIES_PERMISSION_KEYS)[number],
  boolean
>;
