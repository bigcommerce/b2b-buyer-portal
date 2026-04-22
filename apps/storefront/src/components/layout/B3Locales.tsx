import { useContext } from 'react';
import { Box } from '@mui/material';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { GlobalContext } from '@/shared/global';
import { useAppSelector } from '@/store';
import { B3SStorage } from '@/utils/b3Storage';

import B3DropDown from '../B3DropDown';

export default function B3Locales() {
  const isMultiLocaleEnabled = useFeatureFlag('LOCAL-3191.B2B_multi_language');
  const availableLocales = useAppSelector(({ global }) => global.availableLocales);

  const {
    state: { bcLanguage },
    dispatch,
  } = useContext(GlobalContext);

  if (!isMultiLocaleEnabled || availableLocales.length <= 1) {
    return null;
  }

  const list = availableLocales.map(({ code }) => ({ key: code, name: code.toUpperCase() }));

  const handleLocaleChange = (code: string | number) => {
    const langCode = String(code);
    B3SStorage.set('bcLanguage', langCode);
    dispatch({ type: 'common', payload: { bcLanguage: langCode } });
  };

  return (
    <Box
      sx={{
        '& .MuiListItemButton-root': {
          paddingLeft: 0,
          paddingRight: 0,
        },
        '& .MuiListItemText-root': {
          flex: 'none',
        },
      }}
    >
      <B3DropDown
        title={bcLanguage.toUpperCase()}
        list={list}
        value={bcLanguage}
        handleItemClick={handleLocaleChange}
      />
    </Box>
  );
}
