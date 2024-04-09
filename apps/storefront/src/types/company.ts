export interface CompanyInfo {
  id: string
  companyName: string
  status: number
}

export interface Customer {
  id: number | string
  phoneNumber: string
  firstName: string
  lastName: string
  emailAddress: string
  customerGroupId: number
  role: number
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

export enum CustomerRole {
  ADMIN = 0,
  SENIOR_BUYER = 1,
  JUNIOR_BUYER = 2,
  SUPER_ADMIN = 3,
  B2C = 99,
  GUEST = 100,
}
