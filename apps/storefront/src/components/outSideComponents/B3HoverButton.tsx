import { useContext, useEffect, useState } from 'react';
import { Box, Button, Snackbar, SnackbarOrigin, SxProps } from '@mui/material';

import {
  CHECKOUT_URL,
  FINISH_QUOTE_DEFUALT_VALUE,
  TRANSLATION_FINISH_QUOTE_VARIABLE,
} from '@/constants';
import { useGetButtonText } from '@/hooks';
import useMobile from '@/hooks/useMobile';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { useAppSelector } from '@/store';

import {
  getHoverColor,
  getLocation,
  getPosition,
  getStyles,
  setMUIMediaStyle,
  splitCustomCssValue,
} from './utils/b3CustomStyles';

interface B3HoverButtonProps {
  isOpen: boolean;
  productQuoteEnabled: boolean;
  setOpenPage: SetOpenPage;
}

export default function B3HoverButton(props: B3HoverButtonProps) {
  const { isOpen, setOpenPage, productQuoteEnabled } = props;

  const [showFinishQuote, setShowFinishQuote] = useState<boolean>(false);
  const draftQuoteListLength = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteList.length);

  useEffect(() => {
    if (draftQuoteListLength) {
      setShowFinishQuote(true);
    } else setShowFinishQuote(false);
  }, [isOpen, draftQuoteListLength]);

  const { href } = window.location;

  const {
    state: { floatingAction },
  } = useContext(CustomStyleContext);

  const [isMobile] = useMobile();

  const {
    text = '',
    color = '#3385d6',
    customCss = '',
    location = 'bottomRight',
    horizontalPadding = '',
    verticalPadding = '',
    enabled = false,
  } = floatingAction;

  const buttonText = useGetButtonText(
    TRANSLATION_FINISH_QUOTE_VARIABLE,
    text,
    FINISH_QUOTE_DEFUALT_VALUE,
  );

  const defaultLocation: SnackbarOrigin = {
    vertical: 'bottom',
    horizontal: 'right',
  };

  const cssInfo = splitCustomCssValue(customCss);
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string;
    mediaBlocks: string[];
  } = cssInfo;
  const MUIMediaStyle = setMUIMediaStyle(mediaBlocks);

  const defaultSx: SxProps = {
    backgroundColor: color,
    padding: '6px 16px',
    ...getStyles(cssValue),
  };

  const positionStyles = isMobile ? {} : getPosition(horizontalPadding, verticalPadding, location);

  if (href.includes(CHECKOUT_URL)) return null;
  return (
    <Snackbar
      sx={{
        zIndex: '99999999993',
        width: 'auto',
        ...positionStyles,
      }}
      anchorOrigin={getLocation(location) || defaultLocation}
      open
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: 'auto',
        }}
      >
        {enabled &&
          showFinishQuote &&
          !isOpen &&
          productQuoteEnabled &&
          !href.includes('/cart') && (
            <Button
              sx={{
                height: '42px',
                ':hover': {
                  backgroundColor: getHoverColor(color, 0.2),
                },
                ...defaultSx,
                ...MUIMediaStyle,
              }}
              onClick={() => {
                setOpenPage({
                  isOpen: true,
                  openUrl: '/quoteDraft',
                  params: {
                    quoteBtn: 'open',
                  },
                });
              }}
              variant="contained"
            >
              {buttonText}
            </Button>
          )}
      </Box>
    </Snackbar>
  );
}
