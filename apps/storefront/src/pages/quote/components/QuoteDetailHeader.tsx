import {
  useNavigate,
} from 'react-router-dom'
import {
  format,
} from 'date-fns'

import {
  Box,
  Grid,
  styled,
  Typography,
} from '@mui/material'

import {
  ArrowBackIosNew,
} from '@mui/icons-material'

import {
  useContext,
} from 'react'

import {
  QuoteStatus,
} from './QuoteStatus'

import {
  useMobile,
} from '@/hooks'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

import {
  CustomButton,
} from '@/components'

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '0.5rem',
}))

interface QuoteDetailHeaderProps {
  status: string,
  quoteNumber: string,
  issuedAt: number,
  expirationDate: number,
  exportPdf: () => void,
  printQuote: () => void,
  role: number | string,
}

const QuoteDetailHeader = (props: QuoteDetailHeaderProps) => {
  const [isMobile] = useMobile()

  const {
    status,
    quoteNumber,
    issuedAt,
    expirationDate,
    exportPdf,
    printQuote,
    role,
  } = props

  const {
    state: {
      portalStyle: {
        primaryColor = '',
      },
    },
  } = useContext(CustomStyleContext)

  const navigate = useNavigate()
  const gridOptions = (xs: number) => (isMobile ? {} : {
    xs,
  })

  return (
    <>
      {
        +role !== 100 && (
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
                navigate('/quotes')
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
              <p style={{
                color: primaryColor,
              }}
              >
                Back to quote lists

              </p>
            </Box>
          </Box>
        )
      }

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
                color: '#263238',
              }}
            >
              {`Quote #${quoteNumber || ''}`}
            </Typography>

            <QuoteStatus code={status} />
          </Box>
          <Box>
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                Issued on:
              </Typography>
              <span>{`${issuedAt ? format(+issuedAt * 1000, 'dd MMM yyyy') : ''}`}</span>
            </StyledCreateName>
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                Expiration date:
              </Typography>
              <span>{`${expirationDate ? format(+expirationDate * 1000, 'dd MMM yyyy') : ''}`}</span>
            </StyledCreateName>
          </Box>
        </Grid>
        {
          +role !== 100 && (
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
                  Print
                </CustomButton>
                <CustomButton
                  variant="outlined"
                  onClick={exportPdf}
                >
                  DownLoad pdf
                </CustomButton>
              </Box>
            </Grid>
          )
        }

      </Grid>
    </>
  )
}

export default QuoteDetailHeader
