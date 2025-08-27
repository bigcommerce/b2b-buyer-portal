import { useContext } from 'react';
import { Alert, Box } from '@mui/material';

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { B3SStorage } from '@/utils';

import { RegisteredContext } from './context/RegisteredContext';
import { PrimaryButton } from './PrimaryButton';
import { StyleTipContainer } from './styled';

interface Props {
  handleFinish: () => void;
  isBCToB2B?: boolean;
}

export default function RegisteredFinish({ handleFinish, isBCToB2B = false }: Props) {
  const { state } = useContext(RegisteredContext);
  const b3Lang = useB3Lang();

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);
  const [isMobile] = useMobile();

  const customColor = getContrastColor(backgroundColor);

  const { storeName } = useContext(GlobalContext).state;

  const { accountType, submitSuccess, isAutoApproval } = state;

  const blockPendingAccountOrderCreation =
    B3SStorage.get('blockPendingAccountOrderCreation') && !isAutoApproval;

  const renderB2BSuccessPage = () => {
    if (accountType === '1') {
      return isAutoApproval ? (
        <StyleTipContainer>
          {b3Lang('global.registerFinish.autoApproved.tip', { storeName })}
        </StyleTipContainer>
      ) : (
        <>
          {blockPendingAccountOrderCreation && (
            <Alert
              severity="warning"
              variant="filled"
              sx={{
                margin: 'auto',
                borderRadius: '4px',
                padding: '6px 16px',
                maxWidth: '820px',
              }}
            >
              {b3Lang('global.registerFinish.blockPendingAccountOrderCreation.tip')}
            </Alert>
          )}
          <StyleTipContainer>
            {blockPendingAccountOrderCreation
              ? b3Lang('global.registerFinish.notAutoApproved.warningTip')
              : b3Lang('global.registerFinish.notAutoApproved.tip')}
          </StyleTipContainer>
        </>
      );
    }

    if (accountType === '2') {
      return (
        <StyleTipContainer>
          {b3Lang('global.registerFinish.bcSuccess.tip', { storeName })}
        </StyleTipContainer>
      );
    }
    return undefined;
  };

  return (
    <Box
      sx={
        isBCToB2B
          ? {
              pl: 2,
              pr: 2,
              mt: 2,
              '& p': {
                color: customColor,
              },
              width: isMobile ? '100%' : '537px',
              boxShadow:
                '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
              borderRadius: '4px',
              background: '#FFFFFF',
              padding: '0 0.8rem 1rem 0.8rem',
            }
          : {
              mt: 2,
              '& p': {
                color: customColor,
              },
            }
      }
    >
      {submitSuccess && (
        <>
          {renderB2BSuccessPage()}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              pt: 2,
            }}
          >
            <PrimaryButton onClick={handleFinish}>{b3Lang('global.button.finish')}</PrimaryButton>
          </Box>
        </>
      )}
    </Box>
  );
}
