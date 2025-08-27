import { useB3Lang } from '@b3/lang';
import { Check } from '@mui/icons-material';
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import useMobile from '@/hooks/useMobile';
import { useAppSelector } from '@/store';

interface B2BAutoCompleteCheckboxProps {
  handleChangeCompanyIds: (companyIds: number[]) => void;
}

function B2BAutoCompleteCheckbox({ handleChangeCompanyIds }: B2BAutoCompleteCheckboxProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const { id: currentCompanyId, companyName } = useAppSelector(
    ({ company }) => company.companyInfo,
  );
  const { selectCompanyHierarchyId, companyHierarchyList, companyHierarchySelectSubsidiariesList } =
    useAppSelector(({ company }) => company.companyHierarchyInfo);

  const [isCheckedAll, setIsCheckedAll] = useState<boolean>(false);
  const [companyNames, setCompanyNames] = useState<string[]>([companyName]);

  const [companyIds, setCompanyIds] = useState<number[]>([
    Number(selectCompanyHierarchyId) || Number(currentCompanyId),
  ]);
  const newCompanyHierarchyList = useMemo(() => {
    const allCompany = {
      companyId: -1,
      companyName: 'All',
      parentCompanyId: null,
      parentCompanyName: '',
    };

    return [
      allCompany,
      ...(selectCompanyHierarchyId ? companyHierarchySelectSubsidiariesList : companyHierarchyList),
    ];
  }, [companyHierarchyList, selectCompanyHierarchyId, companyHierarchySelectSubsidiariesList]);

  useEffect(() => {
    setCompanyIds([Number(selectCompanyHierarchyId) || Number(currentCompanyId)]);
  }, [selectCompanyHierarchyId, currentCompanyId]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const currentValues = typeof value === 'string' ? [value] : value;
    let selectCompanies: number[] = [];

    if (currentValues.includes('All')) {
      if (
        companyNames.includes('All') &&
        (currentValues.length !== newCompanyHierarchyList.length ||
          (newCompanyHierarchyList.length === 2 && isCheckedAll))
      ) {
        setIsCheckedAll(false);
        selectCompanies = [];
        newCompanyHierarchyList.forEach(
          ({ companyName, companyId }: { companyName: string; companyId: number }) => {
            if (currentValues.includes(companyName) && companyName !== 'All') {
              selectCompanies.push(companyId);
            }
          },
        );
      } else {
        selectCompanies = [-1];
        setIsCheckedAll(true);
      }
    }

    if (!currentValues.includes('All')) {
      if (isCheckedAll) {
        selectCompanies = [Number(selectCompanyHierarchyId) || Number(currentCompanyId)];
        setIsCheckedAll(false);
      } else {
        selectCompanies = [];
        currentValues.forEach((item: string) => {
          const company = newCompanyHierarchyList.find((company) => company.companyName === item);

          if (company) {
            selectCompanies.push(company.companyId);
          }
        });

        if (!currentValues.length) {
          selectCompanies = [-1];
          setIsCheckedAll(true);
        }
      }
    }

    setCompanyIds(selectCompanies);

    let selectedCompanyIds = selectCompanies;

    if (selectCompanyHierarchyId && selectCompanies.includes(-1)) {
      selectedCompanyIds = [];
      companyHierarchySelectSubsidiariesList.forEach(({ companyId }: { companyId: number }) => {
        selectedCompanyIds.push(companyId);
      });
    }

    handleChangeCompanyIds(selectedCompanyIds);
  };

  useEffect(() => {
    const newSelectedCompany: string[] = [];

    if (companyIds.length) {
      companyIds.forEach((id) => {
        const currentCompany = newCompanyHierarchyList.find(
          (company) => Number(company.companyId) === Number(id),
        );

        if (currentCompany) {
          newSelectedCompany.push(currentCompany.companyName);
        }
      });
    } else {
      const activeCompany = selectCompanyHierarchyId || currentCompanyId;
      const currentCompany = newCompanyHierarchyList.find(
        (company) => Number(company.companyId) === Number(activeCompany),
      );

      if (currentCompany) {
        newSelectedCompany.push(currentCompany.companyName);
      }
    }

    setCompanyNames(newSelectedCompany);
    // ignore selectCompanyHierarchyId because it is not a value that must be monitored
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyIds, newCompanyHierarchyList, currentCompanyId]);

  const showName = useMemo(() => {
    if (companyNames.includes('All')) {
      return ['All'];
    }

    return companyNames;
  }, [companyNames]);

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 300,
      },
    },
  };

  return (
    <FormControl sx={{ width: isMobile ? '100%' : 235 }} variant="filled">
      <InputLabel id="autoComplete-multiple-checkbox-label">
        {b3Lang('global.B2BAutoCompleteCheckbox.input.label')}
      </InputLabel>
      <Select
        MenuProps={MenuProps}
        id="autoComplete-multiple-checkbox"
        labelId="autoComplete-multiple-checkbox-label"
        multiple
        onChange={handleChange}
        renderValue={(selected) => selected.join(', ')}
        sx={{
          backgroundColor: '#efeae7',
          '& #autoComplete-multiple-checkbox': {
            paddingTop: '20px',
          },
        }}
        value={showName}
      >
        {newCompanyHierarchyList.map((company) => (
          <MenuItem
            key={`${company.companyId}-${company.companyName}`}
            sx={{
              width: isMobile ? '100%' : '300px',
              alignItems: 'flex-start',
            }}
            value={company.companyName}
          >
            <Checkbox
              checked={
                companyNames.includes(company.companyName) && companyIds.includes(company.companyId)
              }
            />
            <ListItemText
              primary={company.companyName}
              sx={{
                '& span': {
                  width: '100%',
                  whiteSpace: 'break-spaces',
                  wordWrap: 'break-word',
                  paddingTop: '9px',
                },
              }}
              title={company.companyName}
            />
            {companyNames.includes(company.companyName) &&
              companyIds.includes(company.companyId) && <Check sx={{ marginTop: '9px' }} />}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default B2BAutoCompleteCheckbox;
