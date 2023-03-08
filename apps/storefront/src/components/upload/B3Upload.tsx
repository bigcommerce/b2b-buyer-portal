import {
  Box,
  Button,
  Link,
  Alert,
} from '@mui/material'

import Grid from '@mui/material/Unstable_Grid2'

import {
  useRef,
  useState,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
} from 'react'

import {
  DropzoneArea,
} from 'react-mui-dropzone'

import styled from '@emotion/styled'

import InsertDriveFile from '@mui/icons-material/InsertDriveFile'

import {
  getDefaultCurrencyInfo,
} from '@/utils'

import {
  B2BProductsBulkUploadCSV,
  BcProductsBulkUploadCSV,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Sping,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

import {
  B3Dialog,
} from '../B3Dialog'

import {
  B3UploadLoadding,
} from './B3UploadLoadding'
import BulkUploadTable from './BulkUploadTable'

import {
  removeEmptyRow,
  parseEmptyData,
  ParseEmptyDataProps,
} from './utils'

interface B3UploadProps {
  isOpen: boolean,
  setIsOpen: Dispatch<SetStateAction<boolean>>,
  bulkUploadTitle?: string,
  addBtnText?: string,
  handleAddToList: (validProduct: CustomFieldItems) => void,
  setProductData?: (product: CustomFieldItems) => void,
  isLoading?: boolean,
  isToCart?: boolean,
}

interface BulkUploadCSVProps {
  currencyCode: string,
  productList: CustomFieldItems,
  channelId?: number,
  isToCart: boolean,
}

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

export const B3Upload = (props: B3UploadProps) => {
  const {
    isOpen,
    setIsOpen,
    bulkUploadTitle = 'Bulk upload',
    addBtnText = 'add to list',
    handleAddToList = () => {},
    setProductData = () => {},
    isLoading = false,
    isToCart = false,
  } = props

  const [isMobile] = useMobile()

  const {
    state: {
      isB2BUser,
      currentChannelId,
    },
  } = useContext(GlobaledContext)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<string>('init')
  const [fileDatas, setFileDatas] = useState<CustomFieldItems>({})
  const [fileName, setFileName] = useState('')
  const [fileErrorText, setFileErrorText] = useState('')

  const {
    currency_code: currencyCode,
  } = getDefaultCurrencyInfo()

  const handleVerificationFile = (size: number, type: string): string => {
    if (type !== 'text/csv') {
      return 'Table structure is wrong. Please download sample and follow it\'s structure.'
    }

    if (size > 1024 * 1024 * 50) {
      return 'Maximum file size 50MB'
    }
    return ''
  }

  const handleBulkUploadCSV = async (parseData: ParseEmptyDataProps[]) => {
    try {
      const params: BulkUploadCSVProps = {
        currencyCode,
        productList: parseData,
        isToCart,
      }

      if (!isB2BUser) params.channelId = currentChannelId
      const BulkUploadCSV = isB2BUser ? B2BProductsBulkUploadCSV : BcProductsBulkUploadCSV

      const {
        productUpload,
      } = await BulkUploadCSV(params)

      if (productUpload) {
        const {
          result,
        } = productUpload
        const validProduct = result?.validProduct || []

        setProductData(validProduct)
        setFileDatas(result)
        setStep('end')
      }
    } catch (e) {
      setStep('init')
      console.error(e)
    }
  }

  const parseFile: (file: File) => Promise<ParseEmptyDataProps[]> = (file) => new Promise((resolve, reject) => {
    const errorText = handleVerificationFile(file?.size, file?.type)

    if (errorText) {
      reject(new Error(errorText))
      return
    }
    const reader = new FileReader()

    reader.addEventListener('load', async (b: any) => {
      const csvdata = b.target.result

      if (csvdata) {
        const content = csvdata.split('\n')
        const headerRow = content.slice(0, 1)[0]
        const columns = headerRow.split(',').length
        const EmptyData = removeEmptyRow(content)

        let error = ''

        if (EmptyData.length > 1) {
          for (let i = 1; i < EmptyData.length; i += 1) {
            const signleRow = EmptyData[i].split(',')
            if (signleRow.length > columns) {
              error = 'Please use the template file provided.'
            }
          }
        }

        if (error) {
          reject(new Error(error))
          return
        }
        const parseData: ParseEmptyDataProps[] = parseEmptyData(EmptyData)
        resolve(parseData)
      }
    })

    reader.readAsBinaryString(file)
  })

  const handleChange = async (files: File[]) => {
    // init loadding end
    const file = files.length > 0 ? files[0] : null

    if (file) {
      try {
        const parseData = await parseFile(file)
        if (parseData.length) {
          setFileErrorText('')
          setStep('loadding')
          setFileName(file.name)
          await handleBulkUploadCSV(parseData)
        }
      } catch (error) {
        if ((error as Error)?.message) {
          setFileErrorText((error as Error)?.message)
        }
      }
    }
  }

  const openFile = () => {
    if (uploadRef.current) (uploadRef.current.children[1] as HTMLElement).click()
  }

  const handleConfirmToList = async () => {
    const validProduct = fileDatas?.validProduct || []
    const stockErrorFile = fileDatas?.stockErrorFile || ''
    const stockErrorSkus = fileDatas?.stockErrorSkus || []
    if (validProduct?.length === 0) return

    if (validProduct) {
      const productsData: CustomFieldItems = {
        validProduct,
      }

      if (stockErrorSkus.length > 0) {
        productsData.stockErrorFile = stockErrorFile
      }

      await handleAddToList(productsData)

      setStep('init')
    }
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
          <InsertDriveFile color="primary" />
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
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: 'center',
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
              marginLeft: '0.5rem',
            }}
          >
            <Link
              href="https://silk-demo-store45.mybigcommerce.com/content/sample_template.csv"
              underline="none"
            >
              Download sample
            </Link>
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

  useEffect(() => {
    setFileErrorText('')
    setStep('init')
  }, [isOpen])

  return (
    <B3Dialog
      isOpen={isOpen}
      title={bulkUploadTitle}
      maxWidth="lg"
      rightSizeBtn={addBtnText}
      leftSizeBtn="cancel"
      handleLeftClick={() => {
        setStep('init')
        setIsOpen(false)
      }}
      handRightClick={() => {
        handleConfirmToList()
      }}
      showRightBtn={step === 'end'}
      isShowBordered={false}
    >
      {
        fileErrorText.length > 0 && (
          <Box
            sx={{
              m: '0 0 1rem 0',
              p: '0 1rem',
            }}
          >
            <Alert
              variant="filled"
              severity="error"
            >
              {fileErrorText}
            </Alert>
          </Box>
        )
      }
      <Box
        sx={{
          maxHeight: isMobile ? '200px' : 'calc(100% - 64px)',
          minWidth: isMobile ? '100%' : '600px',
          margin: isMobile ? '' : '1rem',
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
        <B3Sping
          isSpinning={isLoading}
          spinningHeight="auto"
        >
          {
            step === 'end' && (
            <BulkUploadTable
              setStep={setStep}
              fileDatas={fileDatas}
              fileName={fileName}
            />
            )
          }

        </B3Sping>
      </Box>
    </B3Dialog>
  )
}
