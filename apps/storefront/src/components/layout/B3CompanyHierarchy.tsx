import { useMemo } from 'react';
import { useB3Lang } from '@b3/lang';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Grid } from '@mui/material';

import { useAppSelector } from '@/store';

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

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const { selectCompanyHierarchyId, companyHierarchyList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const info = useMemo(() => {
    const showTitileId = selectCompanyHierarchyId || currentCompanyId;

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
  }, [selectCompanyHierarchyId, currentCompanyId, companyHierarchyList]);

  const menuRenderItemName = (itme: ListItemProps) => {
    const { name, key } = itme;

    const selectId = selectCompanyHierarchyId || currentCompanyId;

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

  const { backgroundColor, langId: chipLangId } = selectCompanyHierarchyId
    ? chipInfo.representingInfo
    : chipInfo.currentInfo;

  if (!info?.list?.length) return null;

  return (
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
        handleItemClick={() => {}}
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
  );
}

export default B3CompanyHierarchy;
