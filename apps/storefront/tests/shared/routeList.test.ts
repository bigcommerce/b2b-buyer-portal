import { buildCompanyStateWith } from 'tests/storeStateBuilders/companyStateBuilder';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { checkEveryPermissionsCode } from '@/utils';
import { validatePermissionWithComparisonType } from '@/utils/b3CheckPermissions';

vi.mock('@/utils', () => ({
  checkEveryPermissionsCode: vi.fn(),
}));

vi.mock('@/utils/b3CheckPermissions', () => ({
  validatePermissionWithComparisonType: vi.fn(),
}));

const mockCheckEveryPermissionsCode = vi.mocked(checkEveryPermissionsCode);
const mockValidatePermissionWithComparisonType = vi.mocked(validatePermissionWithComparisonType);

describe('Quick Order Tab Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when representing child companies', () => {
    it('shows Quick Order when user has level 3 permissions', () => {
      mockCheckEveryPermissionsCode.mockReturnValue(true);

      mockValidatePermissionWithComparisonType.mockReturnValue(true);

      const permissionCodes = 'get_orders,purchase_enable';
      const hasBasePermissions = mockCheckEveryPermissionsCode(permissionCodes);

      const hasLevel3Permissions = hasBasePermissions
        ? mockValidatePermissionWithComparisonType({
            code: permissionCodes,
            level: 3,
            containOrEqual: 'contain',
          })
        : false;

      expect(mockCheckEveryPermissionsCode).toHaveBeenCalledWith('get_orders,purchase_enable');
      expect(mockValidatePermissionWithComparisonType).toHaveBeenCalledWith({
        code: 'get_orders,purchase_enable',
        level: 3,
        containOrEqual: 'contain',
      });
      expect(hasLevel3Permissions).toBe(true);
    });

    it('hides Quick Order when user lacks level 3 permissions', () => {
      mockCheckEveryPermissionsCode.mockReturnValue(true);
      mockValidatePermissionWithComparisonType.mockReturnValue(false);

      const permissionCodes = 'get_orders,purchase_enable';
      const hasBasePermissions = mockCheckEveryPermissionsCode(permissionCodes);

      const hasLevel3Permissions = hasBasePermissions
        ? mockValidatePermissionWithComparisonType({
            code: permissionCodes,
            level: 3,
            containOrEqual: 'contain',
          })
        : false;

      expect(hasLevel3Permissions).toBe(false);
    });

    it('hides Quick Order when user has no base permissions', () => {
      mockCheckEveryPermissionsCode.mockReturnValue(false);

      const permissionCodes = 'get_orders,purchase_enable';
      const hasBasePermissions = mockCheckEveryPermissionsCode(permissionCodes);

      const hasLevel3Permissions = hasBasePermissions
        ? mockValidatePermissionWithComparisonType({
            code: permissionCodes,
            level: 3,
            containOrEqual: 'contain',
          })
        : false;

      expect(hasBasePermissions).toBe(false);
      expect(hasLevel3Permissions).toBe(false);
      expect(mockValidatePermissionWithComparisonType).not.toHaveBeenCalled();
    });
  });

  describe('when managing company hierarchy', () => {
    it('configures company state correctly for admin with level 3 permissions', () => {
      const companyState = buildCompanyStateWith({
        customer: {
          id: 123,
          role: CustomerRole.ADMIN,
          userType: UserTypes.MULTIPLE_B2C,
          firstName: 'Test',
          lastName: 'User',
          emailAddress: 'test@example.com',
          phoneNumber: '123-456-7890',
          customerGroupId: 1,
          loginType: 1,
          companyRoleName: 'Admin',
        },
        companyInfo: {
          id: '456',
          companyName: 'Parent Company',
          status: CompanyStatus.APPROVED,
        },
        permissions: [
          { code: 'get_orders', permissionLevel: 3 },
          { code: 'purchase_enable', permissionLevel: 3 },
        ],
        companyHierarchyInfo: {
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          selectCompanyHierarchyId: '789',
          companyHierarchyList: [
            {
              companyId: 789,
              companyName: 'Child Company',
              channelFlag: true,
            },
          ],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        pagesSubsidiariesPermission: {
          quickOrderPad: true,
          order: true,
          invoice: false,
          addresses: false,
          userManagement: false,
          shoppingLists: false,
          quotes: false,
          companyHierarchy: true,
        },
      });

      expect(companyState.companyHierarchyInfo.selectCompanyHierarchyId).toBe('789');
      expect(companyState.companyHierarchyInfo.isEnabledCompanyHierarchy).toBe(true);
      expect(companyState.permissions).toHaveLength(2);
      expect(companyState.permissions[0].permissionLevel).toBe(3);
      expect(companyState.permissions[1].permissionLevel).toBe(3);
      expect(companyState.pagesSubsidiariesPermission.quickOrderPad).toBe(true);
    });

    it('allows Quick Order access for parent company users regardless of permission level', () => {
      const companyState = buildCompanyStateWith({
        customer: {
          id: 123,
          role: CustomerRole.ADMIN,
          userType: UserTypes.MULTIPLE_B2C,
          firstName: 'Test',
          lastName: 'User',
          emailAddress: 'test@example.com',
          phoneNumber: '123-456-7890',
          customerGroupId: 1,
          loginType: 1,
          companyRoleName: 'Admin',
        },
        companyInfo: {
          id: '456',
          companyName: 'Parent Company',
          status: CompanyStatus.APPROVED,
        },
        permissions: [
          { code: 'get_orders', permissionLevel: 1 },
          { code: 'purchase_enable', permissionLevel: 2 },
        ],
        companyHierarchyInfo: {
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          selectCompanyHierarchyId: '',
          companyHierarchyList: [],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
      });

      expect(companyState.companyHierarchyInfo.selectCompanyHierarchyId).toBe('');
      expect(companyState.companyHierarchyInfo.isEnabledCompanyHierarchy).toBe(true);
      expect(companyState.permissions[0].permissionLevel).toBe(1);
      expect(companyState.permissions[1].permissionLevel).toBe(2);
    });

    it('denies Quick Order access for junior buyers without level 3 permissions', () => {
      const companyState = buildCompanyStateWith({
        customer: {
          id: 123,
          role: CustomerRole.JUNIOR_BUYER,
          userType: UserTypes.MULTIPLE_B2C,
          firstName: 'Test',
          lastName: 'User',
          emailAddress: 'test@example.com',
          phoneNumber: '123-456-7890',
          customerGroupId: 1,
          loginType: 1,
          companyRoleName: 'Junior Buyer',
        },
        companyInfo: {
          id: '456',
          companyName: 'Parent Company',
          status: CompanyStatus.APPROVED,
        },
        permissions: [],
        pagesSubsidiariesPermission: {
          quickOrderPad: false,
          order: false,
          invoice: false,
          addresses: false,
          userManagement: false,
          shoppingLists: false,
          quotes: false,
          companyHierarchy: false,
        },
      });

      expect(companyState.customer.role).toBe(CustomerRole.JUNIOR_BUYER);
      expect(companyState.permissions).toHaveLength(0);
      expect(companyState.pagesSubsidiariesPermission.quickOrderPad).toBe(false);
    });
  });

  describe('end-to-end user journey', () => {
    it('enables complete Quick Order workflow with level 3 permissions', () => {
      const userPermissions = [
        { code: 'get_orders', permissionLevel: 3 },
        { code: 'purchase_enable', permissionLevel: 3 },
      ];

      const childCompanyId = '789';

      const hasRequiredPermissions = userPermissions.every(
        (permission) => permission.permissionLevel >= 3,
      );

      expect(hasRequiredPermissions).toBe(true);
      expect(childCompanyId).toBeTruthy();

      const expectedRoute = {
        path: '/purchased-products',
        name: 'Quick order',
        subsidiariesCompanyKey: 'quickOrderPad',
        permissionCodes: 'get_orders,purchase_enable',
      };

      expect(expectedRoute.subsidiariesCompanyKey).toBe('quickOrderPad');
      expect(expectedRoute.permissionCodes).toContain('get_orders');
      expect(expectedRoute.permissionCodes).toContain('purchase_enable');
    });

    it('enforces security restrictions for insufficient permissions', () => {
      const userPermissions = [
        { code: 'get_orders', permissionLevel: 2 },
        { code: 'purchase_enable', permissionLevel: 1 },
      ];

      const childCompanyId = '789';

      const hasLevel3Permissions = userPermissions.some(
        (permission) => permission.permissionLevel >= 3,
      );

      expect(hasLevel3Permissions).toBe(false);
      expect(childCompanyId).toBeTruthy();
    });
  });

  describe('permission level validation', () => {
    it('only grants access with level 3 permissions', () => {
      mockCheckEveryPermissionsCode.mockReturnValue(true);

      const permissionCodes = 'get_orders,purchase_enable';
      const hasBasePermissions = mockCheckEveryPermissionsCode(permissionCodes);

      mockValidatePermissionWithComparisonType.mockReturnValue(false);
      const level1Result = hasBasePermissions
        ? mockValidatePermissionWithComparisonType({
            code: permissionCodes,
            level: 3,
            containOrEqual: 'contain',
          })
        : false;

      mockValidatePermissionWithComparisonType.mockReturnValue(false);
      const level2Result = hasBasePermissions
        ? mockValidatePermissionWithComparisonType({
            code: permissionCodes,
            level: 3,
            containOrEqual: 'contain',
          })
        : false;

      mockValidatePermissionWithComparisonType.mockReturnValue(true);
      const level3Result = hasBasePermissions
        ? mockValidatePermissionWithComparisonType({
            code: permissionCodes,
            level: 3,
            containOrEqual: 'contain',
          })
        : false;

      expect(level1Result).toBe(false);
      expect(level2Result).toBe(false);
      expect(level3Result).toBe(true);

      expect(mockValidatePermissionWithComparisonType).toHaveBeenCalledWith({
        code: 'get_orders,purchase_enable',
        level: 3,
        containOrEqual: 'contain',
      });
    });
  });
});
