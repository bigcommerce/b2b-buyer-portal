import { ReactNode, useContext, useMemo } from 'react';
import {
  deDE,
  enUS,
  esES,
  frFR,
  itIT,
  type Localization,
  nlNL,
  zhCN,
} from '@mui/material/locale';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { CustomStyleContext } from './shared/customStyleButton';
import { BROWSER_LANG } from './constants';

const MUI_LANG_MAP: Record<string, Localization> = {
  en: enUS,
  zh: zhCN,
  fr: frFR,
  nl: nlNL,
  de: deDE,
  it: itIT,
  es: esES,
};

type Props = {
  children?: ReactNode;
};

function B3ThemeProvider({ children }: Props) {
  const {
    state: {
      portalStyle: { backgroundColor = '', primaryColor = '' },
    },
  } = useContext(CustomStyleContext);

  const theme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            background: {
              default: backgroundColor,
            },
            primary: {
              main: primaryColor || '#1976d2',
            },
          },
        },
        MUI_LANG_MAP[BROWSER_LANG] || enUS,
      ),
    [backgroundColor, primaryColor],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export default B3ThemeProvider;
