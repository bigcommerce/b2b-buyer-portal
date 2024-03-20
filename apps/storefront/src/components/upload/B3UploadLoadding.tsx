import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number }
) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
      }}
    >
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  )
}

interface B3UploadLoaddingProps {
  step: string
}

export default function B3UploadLoadding(props: B3UploadLoaddingProps) {
  const { step } = props
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress === 95 ? 95 : prevProgress + 1
      )
      if (step === 'end') {
        setProgress(100)
        clearInterval(timer)
      }
    }, 100)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [step])
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <CircularProgressWithLabel value={progress} />
      <Box
        sx={{
          fontWeight: 400,
          fontSize: '14px',
          color: '#8C93AD',
          mt: '10px',
        }}
      >
        Uploading file...
      </Box>
    </Box>
  )
}
