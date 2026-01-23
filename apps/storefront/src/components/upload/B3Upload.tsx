import { DropzoneArea } from 'react-mui-dropzone';
import styled from '@emotion/styled';
import { InsertDriveFile } from '@mui/icons-material';
import { Alert, Box, Link, useTheme } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import { useMobile } from '@/hooks/useMobile';
import { ValidProductItem } from '@/pages/QuickOrder/components/ValidProduct';
import {
  B2BProductsBulkUploadCSV,
  BcProductsBulkUploadCSV,
  guestProductsBulkUploadCSV,
} from '@/shared/service/b2b';
import { defaultCurrencyInfoSelector, isB2BUserSelector, useAppSelector } from '@/store';
import { Currency } from '@/types';
import b2bLogger from '@/utils/b3Logger';
import { channelId } from '@/utils/basicConfig';

import B3Dialog from '../B3Dialog';
import CustomButton from '../button/CustomButton';
import B3Spin from '../spin/B3Spin';

import B3UploadLoading from './B3UploadLoading';
import BulkUploadTable from './BulkUploadTable';
import { isFileExtension, parseEmptyData, ParseEmptyDataProps, removeEmptyRow } from './utils';

interface B3UploadProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  bulkUploadTitle?: string;
  addBtnText?: string;
  handleAddToList: (data: {
    validProduct: ValidProductItem[];
    stockErrorFile: string;
  }) => Promise<void>;
  setProductData?: (products: ValidProductItem[]) => void;
  isLoading?: boolean;
  isToCart?: boolean;
  withModifiers?: boolean;
}

interface BulkUploadCSVProps {
  currencyCode: string;
  productList: CustomFieldItems;
  channelId?: number;
  isToCart: boolean;
  withModifiers?: boolean;
}

const FileUploadContainer = styled(Box)({
  width: '100%',
  borderRadius: '5px',
  position: 'relative',
  '& .file-upload-area': {
    height: '200px',
    '& .MuiSvgIcon-root': {
      display: 'none',
    },
  },
});

export function B3Upload(props: B3UploadProps) {
  const {
    isOpen,
    setIsOpen,
    bulkUploadTitle = 'Bulk upload',
    addBtnText = 'add to list',
    handleAddToList = async () => {},
    setProductData = () => {},
    isLoading = false,
    isToCart = false,
    withModifiers = false,
  } = props;

  const [isMobile] = useMobile();

  const uploadRef = useRef<HTMLInputElement>(null);

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const role = useAppSelector(({ company }) => company.customer.role);

  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

  const [step, setStep] = useState<string>('init');
  const [fileDatas, setFileDatas] = useState<CustomFieldItems>({});
  const [fileName, setFileName] = useState('');
  const [fileErrorText, setFileErrorText] = useState('');

  const currency = useAppSelector(defaultCurrencyInfoSelector);
  const { currency_code: currencyCode } = currency;

  const getRejectMessage = (
    rejectedFile: File,
    acceptedFileTypes: string[],
    maxFileSize: number,
  ) => {
    const { name, size, type } = rejectedFile;

    const isAcceptedFileType = acceptedFileTypes.some((fileType) => {
      if (isFileExtension(fileType)) {
        return name.toLowerCase().endsWith(fileType);
      }

      return type === fileType;
    });

    let message = '';

    if (!isAcceptedFileType) {
      message = "Table structure is wrong. Please download sample and follow it's structure.";
      setFileErrorText(message);

      return message;
    }

    if (size > maxFileSize) {
      message = 'Maximum file size 50MB';
      setFileErrorText(message);

      return message;
    }

    return message;
  };

  const getFileLimitExceedMessage = () => {
    const message = 'Only one file can be uploaded at a time.';

    setFileErrorText(message);

    return message;
  };

  const handleBulkUploadCSV = async (parseData: ParseEmptyDataProps[]) => {
    try {
      const params: BulkUploadCSVProps = {
        currencyCode,
        productList: parseData,
        isToCart,
        withModifiers,
      };

      if (role !== 100) {
        params.channelId = channelId;
      }

      const uploadAction = isB2BUser ? B2BProductsBulkUploadCSV : BcProductsBulkUploadCSV;
      const BulkUploadCSV = role === 100 ? guestProductsBulkUploadCSV : uploadAction;

      const productUpload = await BulkUploadCSV(params);

      if (productUpload) {
        const { result } = productUpload;
        const validProduct = result?.validProduct || [];

        setProductData(validProduct);
        setFileDatas(result);
        setStep('end');
      }
    } catch (e) {
      setStep('init');
      b2bLogger.error(e);
    }
  };

  const parseFile: (file: File) => Promise<ParseEmptyDataProps[]> = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener('load', async (b: any) => {
        const csvdata = b.target.result;

        if (csvdata) {
          const content = csvdata.split('\n');
          const headerRow = content.slice(0, 1)[0];
          const columns = headerRow.split(',').length;
          const EmptyData = removeEmptyRow(content);

          let error = '';

          if (EmptyData.length > 1) {
            for (let i = 1; i < EmptyData.length; i += 1) {
              const signleRow = EmptyData[i].split(',');

              if (signleRow.length > columns) {
                error = 'Please use the template file provided.';
              }
            }
          }

          if (error) {
            reject(new Error(error));

            return;
          }

          const parseData: ParseEmptyDataProps[] = parseEmptyData(EmptyData);

          resolve(parseData);
        }
      });

      reader.readAsBinaryString(file);
    });

  const handleChange = async (files: File[]) => {
    const file = files.length > 0 ? files[0] : null;

    if (file) {
      try {
        const parseData = await parseFile(file);

        if (parseData.length) {
          setFileErrorText('');
          setStep('loading');
          setFileName(file.name);
          await handleBulkUploadCSV(parseData);
        }
      } catch (error) {
        if ((error as Error).message) {
          setFileErrorText((error as Error).message);
        }
      }
    }
  };

  const handleConfirmToList = async () => {
    const validProduct = fileDatas.validProduct || [];
    const stockErrorFile = fileDatas.stockErrorFile || '';

    if (validProduct?.length === 0) {
      return;
    }

    if (validProduct) {
      const productsData: { validProduct: ValidProductItem[]; stockErrorFile: string } = {
        validProduct,
        stockErrorFile,
      };

      await handleAddToList(productsData);

      setStep('init');
    }
  };

  const openFile = () => {
    if (uploadRef.current) {
      (uploadRef.current.children[1] as HTMLElement).click();
    }
  };

  const content = (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        top: '50%',
        left: '50%',
        pointerEvents: 'none',
      }}
    >
      <Grid
        container
        direction="column"
        display="flex"
        justifyContent="center"
        rowSpacing={1.5}
        sx={{
          marginTop: '12px',
        }}
      >
        <div>
          <Grid display="flex" justifyContent="center" xs={12}>
            <InsertDriveFile
              sx={{
                color: primaryColor || '#1976D2',
                fontSize: '40px',
              }}
            />
          </Grid>
          <Grid display="flex" justifyContent="center" xs={12}>
            <Box
              sx={{
                fontSize: '16px',
                fontWeight: '400',
                color: '#5E637A',
              }}
            >
              Drag & drop file here
            </Box>
          </Grid>
        </div>

        <Grid
          display="flex"
          sx={{
            fontWeight: 400,
            fontSize: '14px',
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: 'center',
          }}
          xs={12}
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
              sx={{
                color: primaryColor,
                pointerEvents: 'auto',
              }}
              underline="none"
            >
              Download sample
            </Link>
          </Box>
        </Grid>

        <Grid display="flex" justifyContent="center" xs={12}>
          <CustomButton onClick={openFile} sx={{ pointerEvents: 'auto' }} variant="outlined">
            Upload file
          </CustomButton>
        </Grid>
      </Grid>
    </Box>
  );

  useEffect(() => {
    setFileErrorText('');
    setStep('init');
  }, [isOpen]);

  return (
    <B3Dialog
      dialogContentSx={
        step === 'end'
          ? {
              paddingBottom: '2px',
            }
          : {}
      }
      handRightClick={() => {
        handleConfirmToList();
      }}
      handleLeftClick={() => {
        setStep('init');
        setIsOpen(false);
      }}
      isOpen={isOpen}
      isShowBordered={false}
      leftSizeBtn="cancel"
      maxWidth="lg"
      rightSizeBtn={addBtnText}
      showRightBtn={step === 'end'}
      title={bulkUploadTitle}
    >
      {fileErrorText.length > 0 && (
        <Box
          sx={{
            m: '0 0 1rem 0',
          }}
        >
          <Alert severity="error" variant="filled">
            {fileErrorText}
          </Alert>
        </Box>
      )}
      <Box
        sx={{
          maxHeight: isMobile ? '200px' : 'calc(100% - 64px)',
          minWidth: isMobile ? '100%' : '600px',
        }}
      >
        {step === 'init' && (
          <FileUploadContainer
            ref={uploadRef}
            sx={{
              border: `1px dashed ${primaryColor || '#1976D2'}`,
            }}
          >
            {content}
            <DropzoneArea
              acceptedFiles={['text/csv', '.csv']}
              dropzoneClass="file-upload-area"
              dropzoneText=""
              filesLimit={1}
              getDropRejectMessage={getRejectMessage}
              getFileLimitExceedMessage={getFileLimitExceedMessage}
              maxFileSize={50 * 1024 * 1024}
              onChange={handleChange}
              showAlerts={false}
              showPreviews={false}
              showPreviewsInDropzone={false}
            />
          </FileUploadContainer>
        )}

        {step === 'loading' && <B3UploadLoading step={step} />}
        <B3Spin isSpinning={isLoading} spinningHeight="auto">
          {step === 'end' && (
            <BulkUploadTable fileDatas={fileDatas} fileName={fileName} setStep={setStep} />
          )}
        </B3Spin>
      </Box>
    </B3Dialog>
  );
}
