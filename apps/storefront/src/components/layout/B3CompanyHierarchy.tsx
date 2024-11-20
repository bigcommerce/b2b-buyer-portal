import { useMemo, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Grid } from '@mui/material';

import HierarchyDialog from '@/pages/CompanyHierarchy/components/HierarchyDialog';
import { useAppSelector } from '@/store';
import { CompanyHierarchyProps } from '@/types';

import B3DropDown, { ListItemProps } from '../B3DropDown';

const chipInfo = {
  currentInfo: {
    backgroundColor: 'primary.main',
    langId: 'companyHierarchy.chip.currentCompany',
  },
  representingInfo: {
    backgroundColor: '#ED6C02',
    langId: 'companyHierarchy.chip.selectCompany',
  },
};

function B3CompanyHierarchy() {
  const b3Lang = useB3Lang();

  const [open, setOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [currentRow, setCurrentRow] = useState<Partial<CompanyHierarchyProps> | null>(null);

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);

  const { selectCompanyHierarchyId, companyHierarchyList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const info = useMemo(() => {
    const showTitileId = selectCompanyHierarchyId || currentCompanyId || salesRepCompanyId;

    const title = companyHierarchyList.find(
      (list) => +list.companyId === +showTitileId,
    )?.companyName;

    const list: ListItemProps[] = companyHierarchyList.map((item) => ({
      name: item.companyName,
      key: item.companyId,
    }));

    return {
      title,
      list,
    };
  }, [selectCompanyHierarchyId, currentCompanyId, companyHierarchyList, salesRepCompanyId]);

  const handleClose = () => {
    setOpen(false);
  };
  const handleRowClick = (key: number) => {
    const item = info.list.find((list) => +list.key === key);
    if (!item) return;
    setCurrentRow({
      companyId: +item.key,
      companyName: item.name,
    });
    setOpen(true);
  };

  const menuRenderItemName = (itme: ListItemProps) => {
    const { name, key } = itme;

    const selectId = selectCompanyHierarchyId || currentCompanyId || salesRepCompanyId;

    if (key === +selectId) {
      return (
        <Grid
          container
          direction="row"
          sx={{
            justifyContent: 'space-between',
          }}
        >
          <Grid
            sx={{
              mr: 2,
            }}
          >
            {name}
          </Grid>
          <CheckIcon sx={{ fontSize: '1.2rem' }} />
        </Grid>
      );
    }

    return name;
  };

  const setDialogLoading = (bool: boolean) => {
    setLoading(bool);
  };

  const { backgroundColor, langId: chipLangId } = selectCompanyHierarchyId
    ? chipInfo.representingInfo
    : chipInfo.currentInfo;

  if (!info?.list?.length) return null;

  if (!currentCompanyId && !salesRepCompanyId) return null;

  return (
    <>
      <Box
        sx={{
          minWidth: '100px',
          display: 'flex',
          justifyContent: 'start',
          alignItems: 'center',
          fontSize: '1rem',
          color: '#333333',
          '& .MuiListItemButton-root': {
            paddingLeft: '0',
          },
        }}
      >
        <B3DropDown
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          menuRenderItemName={menuRenderItemName}
          title={info?.title || ''}
          handleItemClick={(item) => handleRowClick(+item)}
          list={info?.list || []}
        />

        <Chip
          label={b3Lang(chipLangId)}
          size="small"
          sx={{
            backgroundColor,
            color: 'white',
            height: 24,
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />
      </Box>

      <HierarchyDialog
        open={open}
        loading={loading}
        handleClose={handleClose}
        currentRow={currentRow}
        setLoading={setDialogLoading}
      />
    </>
  );
}

export default B3CompanyHierarchy;
