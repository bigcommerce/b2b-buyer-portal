import { CompanyHierarchyListProps, CompanyHierarchyProps } from '@/types';

type BuildHierarchyProps = {
  data: CompanyHierarchyListProps[];
  companyId?: number | null;
  parentId?: number | null;
};

export const buildHierarchy = ({
  data,
  companyId,
  parentId,
}: BuildHierarchyProps): CompanyHierarchyProps[] => {
  return data
    .filter((company) => {
      if (companyId) {
        return company.companyId === companyId;
      }
      if (!parentId) {
        return company.parentCompanyId === null || company.parentCompanyId === 0;
      }

      return company.parentCompanyId === parentId;
    })
    .map((company) => ({
      ...company,
      childs: buildHierarchy({
        data,
        parentId: company.companyId,
      }),
    }));
};

export const flattenBuildHierarchyCompanies = (company: CompanyHierarchyProps) => {
  let result: CompanyHierarchyProps[] = [];

  result.push({
    companyId: company.companyId,
    companyName: company.companyName,
    parentCompanyId: company.parentCompanyId,
    parentCompanyName: company.parentCompanyName,
    channelFlag: company.channelFlag,
  });

  if (company.childs && company.childs.length > 0) {
    company.childs.forEach((child) => {
      result = result.concat(flattenBuildHierarchyCompanies(child));
    });
  }

  return result;
};
