import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, Grid } from '@mui/material';

import HierarchyDialog from '@/pages/CompanyHierarchy/components/HierarchyDialog';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { setOpenCompanyHierarchyDropDown, useAppDispatch, useAppSelector } from '@/store';
import { CompanyHierarchyProps, PagesSubsidiariesPermissionProps } from '@/types';

import B3DropDown, { DropDownHandle, ListItemProps } from '../B3DropDown';

const chipInfo = {
  currentInfo: {
    langId: 'companyHierarchy.chip.currentCompany',
  },
  representingInfo: {
    langId: 'companyHierarchy.chip.selectCompany',
  },
};

function B3CompanyHierarchy() {
  const b3Lang = useB3Lang();

  const dispatch = useAppDispatch();

  const [open, setOpen] = useState<boolean>(false);

  const [currentRow, setCurrentRow] = useState<Partial<CompanyHierarchyProps> | null>(null);

  const dropDownRef = useRef<DropDownHandle>(null);

  const {
    state: {
      switchAccountButton: { color = '#ED6C02' },
    },
  } = useContext(CustomStyleContext);

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);

  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);

  const { pagesSubsidiariesPermission } = useAppSelector(({ company }) => company);

  const { selectCompanyHierarchyId, companyHierarchyList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const { isOpenCompanyHierarchyDropDown } = useAppSelector(({ global }) => global);

  const isPagesSubsidiariesPermission = useMemo(() => {
    return Object.keys(pagesSubsidiariesPermission).some(
      (key) => pagesSubsidiariesPermission[key as keyof PagesSubsidiariesPermissionProps],
    );
  }, [pagesSubsidiariesPermission]);

  useEffect(() => {
    if (isOpenCompanyHierarchyDropDown && dropDownRef?.current) {
      dropDownRef.current?.setOpenDropDown();
    }
  }, [isOpenCompanyHierarchyDropDown]);

  const info = useMemo(() => {
    const showTitleId = selectCompanyHierarchyId || currentCompanyId || salesRepCompanyId;

    const title = companyHierarchyList.find(
      (list) => Number(list.companyId) === Number(showTitleId),
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
    dispatch(setOpenCompanyHierarchyDropDown(false));
  };
  const handleRowClick = (key: number) => {
    const item = info.list.find((list) => Number(list.key) === key);
    if (!item) return;
    setCurrentRow({
      companyId: Number(item.key),
      companyName: item.name,
    });
    setOpen(true);
  };

  const menuRenderItemName = (item: ListItemProps) => {
    const { name, key } = item;

    const selectId = selectCompanyHierarchyId || currentCompanyId || salesRepCompanyId;

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
        <Grid
          sx={{
            width: '20px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {key === Number(selectId) && <CheckIcon sx={{ fontSize: '1.2rem' }} />}
        </Grid>
      </Grid>
    );
  };

  const { langId: chipLangId } = selectCompanyHierarchyId
    ? chipInfo.representingInfo
    : chipInfo.currentInfo;

  if (!info?.list?.length || !isPagesSubsidiariesPermission) return null;

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
          ref={dropDownRef}
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
          handleItemClick={(item) => handleRowClick(Number(item))}
          list={info?.list || []}
        />

        <Chip
          label={b3Lang(chipLangId)}
          size="small"
          sx={{
            backgroundColor: selectCompanyHierarchyId ? color : 'primary.main',
            color: 'white',
            height: 24,
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />
      </Box>

      <HierarchyDialog open={open} handleClose={handleClose} currentRow={currentRow} />
    </>
  );
}

export default B3CompanyHierarchy;
