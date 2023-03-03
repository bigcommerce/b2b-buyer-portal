import {
  Box,
  Button,
} from '@mui/material'

import Grid from '@mui/material/Unstable_Grid2'

import {
  useRef,
  useState,
} from 'react'

import {
  DropzoneArea,
} from 'react-mui-dropzone'

import styled from '@emotion/styled'

import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import {
  B3Dialog,
} from '../B3Dialog'

import {
  B3UploadLoadding,
} from './B3UploadLoadding'

import {
  removeEmptyRow,
  parseEmptyData,
} from './utils'

const FileUploadContainer = styled(Box)(() => ({
  width: '100%',
  border: '1px dashed #1976D2',
  borderRadius: '5px',
  position: 'relative',
  '& .file-upload-area': {
    height: '200px',
    '& .MuiSvgIcon-root': {
      display: 'none',
    },
  },
}))

export const B3Upload = () => {
  const uploadRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<string>('init')

  const handleChange = async (files: File[]) => {
    // init loadding end
    const file = files.length > 0 ? files[0] : null

    if (file) {
      const reader = new FileReader()

      reader.addEventListener('load', async (b: any) => {
        const csvdata = b.target.result

        if (csvdata) {
          setStep('loadding')
          const content = csvdata.split('\n')
          const EmptyData = removeEmptyRow(content)
          const parseData = parseEmptyData(EmptyData)
          console.log(EmptyData, parseData)

          // DOTO:
          await new Promise((r) => {
            setTimeout(() => {
              r('1')
            }, 5000)
          })
          setStep('end')
        }
      })

      reader.readAsBinaryString(file)
    }
  }

  const openFile = () => {
    if (uploadRef.current) (uploadRef.current.children[1] as any).click()
  }

  const content = (
    <Box sx={{
      width: 'auto',
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      top: '50%',
      left: '50%',
    }}
    >
      <Grid
        container
        rowSpacing={1.5}
        display="flex"
        direction="column"
        justifyContent="center"
      >
        <Grid
          display="flex"
          justifyContent="center"
          xs={12}
        >
          <InsertDriveFileIcon />
        </Grid>

        <Grid
          display="flex"
          justifyContent="center"
          xs={12}
        >
          <Box sx={{
            fontSize: '16px',
            fontWeight: '400',
            color: '#5E637A',
          }}
          >
            Drag & drop file here
          </Box>
        </Grid>

        <Grid
          display="flex"
          xs={12}
          sx={{
            fontWeight: 400,
            fontSize: '14px',
          }}
        >
          <Box
            sx={{
              color: '#8C93AD',
              whiteSpace: 'nowrap',
            }}
          >
            File types: CSV, maximum size: 50MB.
          </Box>
          <Box
            sx={{
              color: '#1976D2',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Download sample
          </Box>
        </Grid>

        <Grid
          display="flex"
          justifyContent="center"
          xs={12}
        >
          <Button
            onClick={openFile}
            variant="outlined"
          >
            Upload file
          </Button>
        </Grid>

      </Grid>
    </Box>
  )

  return (

    <B3Dialog
      isOpen
      title="test"
      maxWidth="lg"
    >
      <Box
        sx={{
          height: '200px',
          minWidth: '600px',
        }}
      >

        {
          step === 'init' && (
          <FileUploadContainer ref={uploadRef}>
            {content}
            <DropzoneArea
              dropzoneClass="file-upload-area"
              filesLimit={1}
              onChange={handleChange}
              showPreviews={false}
              showPreviewsInDropzone={false}
              showAlerts={false}
              dropzoneText=""
            />
          </FileUploadContainer>
          )
        }

        {
          step === 'loadding' && <B3UploadLoadding step={step} />
        }

        {
          step === 'end' && <Box>123123</Box>
        }
      </Box>
    </B3Dialog>
  )
}
