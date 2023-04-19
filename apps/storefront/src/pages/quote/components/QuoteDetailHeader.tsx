import { useNavigate } from 'react-router-dom'
import { ArrowBackIosNew } from '@mui/icons-material'
import { Box, Grid, styled, Typography, useTheme } from '@mui/material'

import { CustomButton } from '@/components'
import { useMobile } from '@/hooks'
import { displayFormat } from '@/utils'

import QuoteStatus from './QuoteStatus'

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '0.5rem',
}))

interface QuoteDetailHeaderProps {
  status: string
  quoteNumber: string
  issuedAt: number
  expirationDate: number
  exportPdf: () => void
  printQuote: () => Promise<void>
  role: string | number
}

function QuoteDetailHeader(props: QuoteDetailHeaderProps) {
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

  const theme = useTheme()

  const primaryColor = theme.palette.primary.main

  const navigate = useNavigate()
  const gridOptions = (xs: number) =>
    isMobile
      ? {}
      : {
          xs,
        }

  return (
    <>
      {+role !== 100 && (
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
            <p
              style={{
                color: primaryColor,
              }}
            >
              Back to quote lists
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
        <Grid item {...gridOptions(8)}>
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
              <span>{`${issuedAt ? displayFormat(+issuedAt) : ''}`}</span>
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
              <span>{`${
                expirationDate ? displayFormat(+expirationDate) : ''
              }`}</span>
            </StyledCreateName>
          </Box>
        </Grid>
        {+role !== 100 && (
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
              <CustomButton variant="outlined" onClick={exportPdf}>
                DownLoad pdf
              </CustomButton>
            </Box>
          </Grid>
        )}
      </Grid>
    </>
  )
}

export default QuoteDetailHeader
