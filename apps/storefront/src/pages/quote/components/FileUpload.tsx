import { forwardRef, Ref, useImperativeHandle, useState } from 'react';
import { DropzoneArea } from 'react-mui-dropzone';
import styled from '@emotion/styled';
import {
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import noop from 'lodash-es/noop';
import { v1 as uuid } from 'uuid';

import B3Spin from '@/components/spin/B3Spin';
import { useB3Lang } from '@/lib/lang';
import { uploadB2BFile } from '@/shared/service/b2b';
import { snackbar } from '@/utils';

import { FILE_UPLOAD_ACCEPT_TYPE } from '../../../constants';

const FileUploadContainer = styled(Box)(({ style }) => ({
  '& .file-upload-area': {
    cursor: 'pointer',
    '& .MuiDropzoneArea-textContainer': {
      display: 'flex',
      alignItems: 'center',
      color: style?.color || '#1976D2',
    },
    '& .MuiDropzoneArea-text': {
      order: 1,
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '24px',
    },
  },
}));

const FileListItem = styled(Box)((props: CustomFieldItems) => ({
  display: 'flex',
  background: props.hasdelete === 'true' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(0, 0, 0, 0.12)',
  borderRadius: '18px',
  padding: '6px 8px',
  alignItems: 'center',
  margin: '0 0 2px',
  color: 'rgba(0, 0, 0, 0.54)',
  '& .fileList-name-area': {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
  },
  '& .fileList-name': {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    flexGrow: 1,
    flexBasis: '100px',
    maxWidth: '200px',
    color: '#313440',
    fontSize: '14px',
    cursor: 'pointer',
  },
}));

const FileUserTitle = styled(Typography)({
  marginBottom: '16px',
  fontSize: '10px',
  color: 'rgba(0, 0, 0, 0.38)',
  padding: '0 12px',
  textAlign: 'right',
  wordBreak: 'break-word',
});

export interface FileObjects {
  id?: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  title?: string;
  hasDelete?: boolean;
  isCustomer?: boolean;
}

interface FileUploadProps {
  title?: string;
  tips?: string;
  maxFileSize?: number;
  fileNumber?: number;
  acceptedFiles?: string[];
  onchange?: (file: FileObjects) => void;
  fileList: FileObjects[];
  allowUpload?: boolean;
  onDelete?: (id: string) => void;
  limitUploadFn?: () => boolean;
  isEndLoadding?: boolean;
  requestType?: string;
}

const AttachFile = styled(AttachFileIcon)(() => ({
  transform: 'rotate(45deg)',
  marginRight: '5px',
}));

function FileUpload(props: FileUploadProps, ref: Ref<unknown>) {
  const b3Lang = useB3Lang();
  const {
    title = b3Lang('global.fileUpload.addAttachment'),
    tips = b3Lang('global.fileUpload.maxFileSizeMessage'),
    maxFileSize = 2097152, // 2MB
    fileNumber = 3,
    limitUploadFn,
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    onchange = noop,
    fileList = [],
    allowUpload = true,
    onDelete = noop,
    isEndLoadding = false,
    requestType = 'quoteAttachedFile',
  } = props;

  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

  const [loading, setLoading] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    setUploadLoadding: (flag: boolean) => setLoading(flag),
  }));

  const getMaxFileSizeLabel = (maxSize: number) => {
    if (maxSize / 1048576 > 1) {
      return `${(maxSize / 1048576).toFixed(1)}MB`;
    }
    if (maxSize / 1024 > 1) {
      return `${(maxSize / 1024).toFixed(1)}KB`;
    }
    return `${maxSize}B`;
  };

  const getRejectMessage = (rejectedFile: File, acceptedFiles: string[], maxFileSize: number) => {
    const { size, type } = rejectedFile;

    let isAcceptFileType = false;
    acceptedFiles.forEach((acceptedFileType: string) => {
      isAcceptFileType = new RegExp(acceptedFileType).test(type) || isAcceptFileType;
    });

    let message = '';
    if (!isAcceptFileType) {
      message = b3Lang('global.fileUpload.fileTypeNotSupported');
    }

    if (size > maxFileSize) {
      message = b3Lang('global.fileUpload.fileSizeExceedsLimit', {
        maxFileSize: getMaxFileSizeLabel(maxFileSize),
      });
    }

    if (message) {
      snackbar.error(message);
    }

    return message;
  };

  const getFileLimitExceedMessage = () => {
    snackbar.error(
      b3Lang('global.fileUpload.fileSizeExceedsLimit', {
        maxFileSize: getMaxFileSizeLabel(maxFileSize),
      }),
    );
    return '';
  };

  const handleChange = async (files: File[]) => {
    const file = files.length > 0 ? files[0] : null;

    if (file && limitUploadFn && limitUploadFn()) {
      return;
    }

    if (!limitUploadFn && file && fileList.length >= fileNumber) {
      snackbar.error(b3Lang('global.fileUpload.maxFileNumber', { fileNumber }));
      return;
    }

    if (file) {
      try {
        setLoading(true);
        const {
          code,
          data: fileInfo,
          message,
        } = await uploadB2BFile({
          file,
          type: requestType,
        });
        if (code === 200) {
          onchange({
            ...fileInfo,
            id: uuid(),
          });
        } else {
          snackbar.error(message);
        }
      } finally {
        if (!isEndLoadding) {
          setLoading(false);
        }
      }
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  const downloadFile = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <B3Spin isSpinning={loading}>
      <Box
        sx={{
          padding: '12px 0 0',
          width: '100%',
        }}
      >
        <Box>
          {fileList.map((file, index) => (
            <Box key={file.id || index}>
              <FileListItem hasdelete={(file?.hasDelete || '').toString()}>
                <Box className="fileList-name-area">
                  <AttachFile />
                  <Typography
                    className="fileList-name"
                    onClick={() => {
                      downloadFile(file.fileUrl);
                    }}
                  >
                    {file.fileName}
                  </Typography>
                </Box>
                {file.hasDelete && (
                  <DeleteIcon
                    sx={{
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      handleDelete(file?.id || '');
                    }}
                  />
                )}
              </FileListItem>
              <FileUserTitle>{file.title || ''}</FileUserTitle>
            </Box>
          ))}
        </Box>
        {allowUpload && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
            }}
          >
            <FileUploadContainer
              style={{
                color: primaryColor,
              }}
            >
              <DropzoneArea
                dropzoneClass="file-upload-area"
                Icon={AttachFile}
                filesLimit={1}
                onChange={handleChange}
                showPreviews={false}
                showPreviewsInDropzone={false}
                maxFileSize={maxFileSize}
                showAlerts={false}
                dropzoneText={title}
                getDropRejectMessage={getRejectMessage}
                getFileLimitExceedMessage={getFileLimitExceedMessage}
                acceptedFiles={acceptedFiles}
              />
            </FileUploadContainer>

            <Tooltip
              title={tips}
              sx={{
                fontSize: '20px',
                color: 'rgba(0, 0, 0, 0.54)',
              }}
            >
              <HelpIcon />
            </Tooltip>
          </Box>
        )}
      </Box>
    </B3Spin>
  );
}

export default forwardRef(FileUpload);
