import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

import B3Spin from '@/components/spin/B3Spin';
import { getCompanySubsidiaries } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { CompanyHierarchyListProps, CompanyHierarchyProps } from '@/types';
import { buildHierarchy } from '@/utils';

import HierarchyDialog from './components/HierarchyDialog';
import CompanyHierarchyTableTree from './components/TableTree';

function CompanyHierarchy() {
  const [data, setData] = useState<CompanyHierarchyProps[]>([]);

  const [open, setOpen] = useState<boolean>(false);

  const [currentRow, setCurrentRow] = useState<CompanyHierarchyProps | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const originDataRef = useRef<CompanyHierarchyListProps[]>([]);

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const init = async () => {
    setLoading(true);

    const { companySubsidiaries } = await getCompanySubsidiaries();

    const list = buildHierarchy({
      data: companySubsidiaries || [],
    });

    originDataRef.current = companySubsidiaries;

    setData(list);

    setLoading(false);
  };

  useEffect(() => {
    if (currentCompanyId) {
      init();
    }

    // ignore init
    // due they are funtions that do not depend on any reactive value
  }, [currentCompanyId]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleRowClick = (row: CompanyHierarchyProps) => {
    setCurrentRow(row);
    setOpen(true);
  };

  return (
    <B3Spin isSpinning={loading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
        }}
      >
        <CompanyHierarchyTableTree<CompanyHierarchyProps>
          data={data}
          onSwitchCompany={handleRowClick}
          currentCompanyId={currentCompanyId}
          selectCompanyId={selectCompanyHierarchyId}
        />

        <HierarchyDialog
          open={open}
          handleClose={handleClose}
          currentRow={currentRow}
          companyHierarchyAllList={originDataRef?.current || []}
        />
      </Box>
    </B3Spin>
  );
}

export default CompanyHierarchy;
