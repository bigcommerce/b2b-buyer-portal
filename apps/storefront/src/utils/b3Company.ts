import { CompanyHierarchyListProps, CompanyHierarchyProps } from '@/types';

export const buildHierarchy = (
  data: CompanyHierarchyListProps[],
  parentId?: number | null,
): CompanyHierarchyProps[] => {
  return data
    .filter((company) => {
      if (!parentId) {
        return company.parentCompanyId === null || company.parentCompanyId === 0;
      }
      return company.parentCompanyId === parentId;
    })
    .map((company) => ({
      ...company,
      childs: buildHierarchy(data, company.companyId),
    }));
};
