import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, Grid, styled, Typography, useTheme } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { displayFormat } from '@/utils';

import QuoteStatus from './QuoteStatus';

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '0.5rem',
}));

interface QuoteDetailHeaderProps {
  status: string;
  quoteNumber: string;
  issuedAt: number;
  expirationDate: number;
  exportPdf: () => void;
  printQuote: () => Promise<void>;
  role: string | number;
  salesRepInfo: { [key: string]: string };
}

function QuoteDetailHeader(props: QuoteDetailHeaderProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const {
    status,
    quoteNumber,
    issuedAt,
    expirationDate,
    exportPdf,
    printQuote,
    role,
    salesRepInfo,
  } = props;

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

  const navigate = useNavigate();
  const gridOptions = (xs: number) =>
    isMobile
      ? {}
      : {
          xs,
        };

  return (
    <>
      {Number(role) !== 100 && (
        <Box
          sx={{
            marginBottom: '10px',
            width: 'fit-content',
            displayPrint: 'none',
          }}
        >
          <Box
            sx={{
              color: '#1976d2',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => {
              navigate('/quotes');
            }}
          >
            <ArrowBackIosNew
              fontSize="small"
              sx={{
                fontSize: '12px',
                marginRight: '0.5rem',
                color: primaryColor,
              }}
            />
            <p
              style={{
                color: primaryColor,
                margin: '0',
              }}
            >
              {b3Lang('quoteDetail.header.backToQuoteLists')}
            </p>
          </Box>
        </Box>
      )}

      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: `${isMobile ? 'column' : 'row'}`,
          mb: `${isMobile ? '16px' : ''}`,
        }}
      >
        <Grid
          item
          {...gridOptions(8)}
          sx={{
            color: customColor,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: `${isMobile ? 'start' : 'center'}`,
              flexDirection: `${isMobile ? 'column' : 'row'}`,
            }}
          >
            <Typography
              sx={{
                marginRight: '10px',
                fontSize: '34px',
                color: b3HexToRgb(customColor, 0.87),
              }}
            >
              {b3Lang('quoteDetail.header.quoteNumber', {
                quoteNumber: quoteNumber || '',
              })}
            </Typography>

            <QuoteStatus code={status} />
          </Box>
          {(salesRepInfo?.salesRepName || salesRepInfo?.salesRepEmail) && (
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                {b3Lang('quoteDetail.header.salesRep')}
              </Typography>
              <span>
                {salesRepInfo?.salesRepEmail !== ''
                  ? `${salesRepInfo?.salesRepName}(${salesRepInfo?.salesRepEmail})`
                  : salesRepInfo?.salesRepName}
              </span>
            </StyledCreateName>
          )}
          <Box>
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                {b3Lang('quoteDetail.header.issuedOn')}
              </Typography>
              <span>{`${issuedAt ? displayFormat(Number(issuedAt)) : ''}`}</span>
            </StyledCreateName>
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                {b3Lang('quoteDetail.header.expirationDate')}
              </Typography>
              <span>{`${expirationDate ? displayFormat(Number(expirationDate)) : ''}`}</span>
            </StyledCreateName>
          </Box>
        </Grid>
        {Number(role) !== 100 && (
          <Grid
            item
            sx={{
              textAlign: `${isMobile ? 'none' : 'end'}`,
              displayPrint: 'none',
            }}
            {...gridOptions(4)}
          >
            <Box>
              <CustomButton
                variant="outlined"
                sx={{
                  marginRight: '1rem',
                  displayPrint: 'none',
                }}
                onClick={printQuote}
              >
                {b3Lang('quoteDetail.header.print')}
              </CustomButton>
              <CustomButton variant="outlined" onClick={exportPdf}>
                {b3Lang('quoteDetail.header.downloadPDF')}
              </CustomButton>
            </Box>
          </Grid>
        )}
      </Grid>
    </>
  );
}

export default QuoteDetailHeader;
