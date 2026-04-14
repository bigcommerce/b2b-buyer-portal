import { useContext } from 'react';
import { Box } from '@mui/material';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { GlobalContext } from '@/shared/global/context/index';
import { useAppSelector } from '@/store';
import { B3SStorage } from '@/utils/b3Storage';

import B3DropDown from '../B3DropDown';

export default function B3LanguageDropdown() {
  const isMultiLanguageEnabled = useFeatureFlag('PROJECT-7486.b2b_multi_language');
  const availableLanguages = useAppSelector(({ global }) => global.availableLanguages);

  const {
    state: { bcLanguage },
    dispatch,
  } = useContext(GlobalContext);

  if (!isMultiLanguageEnabled || availableLanguages.length <= 1) return null;

  const list = availableLanguages.map(({ code }) => ({ key: code, name: code.toUpperCase() }));

  const handleLanguageChange = (code: string | number) => {
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
      }}
    >
      <B3DropDown
        title={bcLanguage.toUpperCase()}
        list={list}
        value={bcLanguage}
        handleItemClick={handleLanguageChange}
        width="80px"
      />
    </Box>
  );
}
