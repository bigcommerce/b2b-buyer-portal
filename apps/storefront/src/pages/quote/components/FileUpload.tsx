import {
  Box,
  Tooltip,
  Typography,
} from '@mui/material'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import HelpIcon from '@mui/icons-material/Help'
import DeleteIcon from '@mui/icons-material/Delete'

import styled from '@emotion/styled'

import {
  useState,
  Ref,
  forwardRef,
  useImperativeHandle,
} from 'react'

import {
  DropzoneArea,
} from 'react-mui-dropzone'

import {
  noop,
} from 'lodash'

import {
  v1 as uuid,
} from 'uuid'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  FILE_UPLOAD_ACCEPT_TYPE,
} from '../../../constants'

import {
  uploadB2BFile,
} from '@/shared/service/b2b'

import {
  snackbar,
} from '@/utils'

const FileUploadContainer = styled(Box)(() => ({
  '& .file-upload-area': {
    cursor: 'pointer',
    '& .MuiDropzoneArea-textContainer': {
      display: 'flex',
      alignItems: 'center',
      color: '#1976D2',
    },
    '& .MuiDropzoneArea-text': {
      order: 1,
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '24px',
    },
  },
}))

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
}))

const FileUserTitle = styled(Typography)(() => ({
  marginBottom: '16px',
  fontSize: '10px',
  color: 'rgba(0, 0, 0, 0.38)',
  padding: '0 12px',
  textAlign: 'right',
  wordBreak: 'break-word',
}))

export interface FileObjects {
  id?: string,
  fileName: string,
  fileType: string,
  fileUrl: string,
  fileSize?: number,
  title?: string,
  hasDelete?: boolean,
  isCustomer?: boolean,
}

interface FileUploadProps {
  title?: string,
  tips?: string,
  maxFileSize?: number,
  fileNumber?: number,
  acceptedFiles?: string[],
  onchange?: (file: FileObjects) => void,
  fileList: FileObjects[],
  allowUpload?: boolean,
  onDelete?: (id: string) => void,
  limitUploadFn?: () => boolean,
  isEndLoadding?: boolean,
}

const AttachFile = styled(AttachFileIcon)(() => ({
  transform: 'rotate(45deg)',
  marginRight: '5px',
}))

const FileUpload = (props: FileUploadProps, ref: Ref<unknown>) => {
  const {
    title = 'Add Attachment',
    tips = 'You can add up to 3 files,not bigger that 2MB each.',
    maxFileSize = 2097152, // 2MB
    fileNumber = 3,
    limitUploadFn,
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    onchange = noop,
    fileList = [],
    allowUpload = true,
    onDelete = noop,
    isEndLoadding = false,
  } = props

  const [loading, setLoading] = useState<boolean>(false)

  useImperativeHandle(ref, () => ({
    setUploadLoadding: (flag: boolean) => setLoading(flag),
  }))

  const getMaxFileSizeLabel = (maxSize: number) => {
    if (maxSize / 1048576 > 1) {
      return `${(maxSize / 1048576).toFixed(1)}MB`
    }
    if (maxSize / 1024 > 1) {
      return `${(maxSize / 1024).toFixed(1)}KB`
    }
    return `${maxSize}B`
  }

  const getRejectMessage = (
    rejectedFile: File,
    acceptedFiles: string[],
    maxFileSize: number,
  ) => {
    const {
      size,
      type,
    } = rejectedFile

    let isAcceptFileType = false
    acceptedFiles.forEach((acceptedFileType: string) => {
      isAcceptFileType = new RegExp(acceptedFileType).test(type) || isAcceptFileType
    })

    let message = ''
    if (!isAcceptFileType) {
      message = 'file type not support'
    }

    if (size > maxFileSize) {
      message = `file exceeds upload limit. Maximum file size is ${getMaxFileSizeLabel(maxFileSize)}`
    }

    if (message) {
      snackbar.error(message)
    }

    return message
  }

  const getFileLimitExceedMessage = () => {
    snackbar.error(`file exceeds upload limit. Maximum file size is ${getMaxFileSizeLabel(maxFileSize)}`)
    return ''
  }

  const handleChange = async (files: File[]) => {
    const file = files.length > 0 ? files[0] : null

    if (file && limitUploadFn && limitUploadFn()) {
      return
    }

    if (!limitUploadFn && file && fileList.length >= fileNumber) {
      snackbar.error(`You can add up to ${fileNumber} files`)
      return
    }

    if (file) {
      try {
        setLoading(true)
        const {
          code,
          data: fileInfo,
          message,
        } = await uploadB2BFile({
          file,
          type: 'quoteAttachedFile',
        })
        if (code === 200) {
          onchange({
            ...fileInfo,
            id: uuid(),
          })
        } else {
          snackbar.error(message)
        }
      } finally {
        if (!isEndLoadding) {
          setLoading(false)
        }
      }
    }
  }

  const handleDelete = (id: string) => {
    onDelete(id)
  }

  const downloadFile = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  return (
    <B3Sping
      isSpinning={loading}
    >
      <Box sx={{
        padding: '12px 0 0',
        width: '100%',
      }}
      >
        <Box>
          {
            fileList.map((file, index) => (
              <Box key={file.id || index}>
                <FileListItem hasdelete={(file?.hasDelete || '').toString()}>
                  <Box className="fileList-name-area">
                    <AttachFile />
                    <Typography
                      className="fileList-name"
                      onClick={() => { downloadFile(file.fileUrl) }}
                    >
                      {file.fileName}
                    </Typography>
                  </Box>
                  {
                    file.hasDelete && (
                    <DeleteIcon
                      sx={{
                        cursor: 'pointer',
                      }}
                      onClick={() => { handleDelete(file?.id || '') }}
                    />
                    )
                  }
                </FileListItem>
                <FileUserTitle>
                  {file.title || ''}
                </FileUserTitle>
              </Box>
            ))
          }
        </Box>
        {
          allowUpload && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
            }}
          >
            <FileUploadContainer>
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
          )
        }
      </Box>
    </B3Sping>
  )
}

export default forwardRef(FileUpload)
