import { Alert, Box } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { LoginFlagType } from '@/types/login';

import { LoginConfig, loginType } from './config';

interface LoginTipProps {
  flag?: LoginFlagType;
  loginAccount?: LoginConfig;
  showTipInfo: boolean;
}

export default function LoginTip({ flag, loginAccount, showTipInfo }: LoginTipProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const tipInfo = (loginFlag: LoginFlagType, email = '') => {
    const { tip, alertType } = loginType[loginFlag];

    return {
      message: b3Lang(tip, { email }),
      severity: alertType,
    };
  };

  const tip = flag && tipInfo(flag, loginAccount?.email);

  if (!flag || !showTipInfo) return null;
  return (
    <Box
      sx={{
        padding: isMobile ? 0 : '0 5%',
        margin: '30px 0 0 0',
      }}
    >
      {tip && (
        <Alert severity={tip.severity} variant="filled">
          {tip.message}
        </Alert>
      )}
    </Box>
  );
}
