import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'

import {
  useB3Lang,
} from '@b3/lang'

import {
  FormLabel,
} from '@mui/material'

import {
  DropzoneArea,
  FileObject,
  PreviewIconProps,
} from 'react-mui-dropzone'

import {
  FILE_UPLOAD_ACCEPT_TYPE,
} from '../../constants'

import B3UI from './ui'

import {
  DropzoneBox,
} from './styled'

const getPreviewIcon = (fileObject: FileObject, classes: PreviewIconProps) => {
  const {
    type,
  } = fileObject.file
  const iconProps = {
    className: classes.classes,
  }

  if (type.startsWith('image/')) return <ImageRoundedIcon {...iconProps} />

  switch (type) {
    case 'application/pdf':
      return <PictureAsPdfRoundedIcon {...iconProps} />
    // doc docx xls xlsx csv
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'text/csv':
      return <DescriptionRounded {...iconProps} />
    default:
      return <InsertDriveFileRoundedIcon {...iconProps} />
  }
}

interface FileUploadProps extends B3UI.B3UIProps {
  acceptedFiles?: string[],
  filesLimit?: number,
  maxFileSize?: number
  dropzoneText?: string,
  previewText?: string,
  default?: File[],
}

const getMaxFileSizeLabel = (maxSize: number) => {
  if (maxSize / 1048576 > 1) {
    return `${(maxSize / 1048576).toFixed(1)}MB`
  }
  if (maxSize / 1024 > 1) {
    return `${(maxSize / 1024).toFixed(1)}KB`
  }
  return `${maxSize}B`
}

export const B3ControlFileUpload = (props: FileUploadProps) => {
  const b3Lang = useB3Lang()

  const {
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    filesLimit = 3,
    maxFileSize = 2097152, // 2M
    dropzoneText = b3Lang('intl.global.fileUpload.defaultText'),
    previewText = ' ',
    fieldType,
    default: defaultValue = [],
    name,
    setValue,
    title,
  } = props

  const getRejectMessage = (
    rejectedFile: File,
    acceptedFiles: string[],
    maxFileSize: number,
  ) => {
    const {
      name,
      size,
      type,
    } = rejectedFile

    let isAcceptFileType = false
    acceptedFiles.forEach((acceptedFileType) => {
      isAcceptFileType = new RegExp(acceptedFileType).test(type) || isAcceptFileType
    })

    if (!isAcceptFileType) {
      return b3Lang('intl.global.fileUpload.typeNotSupport', {
        name,
      })
    }

    if (size > maxFileSize) {
      return b3Lang('intl.global.fileUpload.fileSizeExceedsLimit', {
        name,
        maxSize: getMaxFileSizeLabel(maxFileSize),
      })
    }

    return ''
  }

  const getFileLimitExceedMessage = () => b3Lang('intl.global.fileUpload.fileNumberExceedsLimit', {
    limit: filesLimit,
  })

  const handleFilesChange = (files: File[]) => {
    if (setValue) {
      setValue(name, files)
    }
  }

  return (
    <>
      {
       ['files'].includes(fieldType) && (
       <>
         {
            title && (
            <FormLabel sx={{
              marginBottom: '5px',
              display: 'block',
            }}
            >
              {title}
            </FormLabel>
            )
          }
         <DropzoneBox>
           <DropzoneArea
             Icon={CloudUploadOutlinedIcon}
             showPreviews
             showFileNamesInPreview
             showPreviewsInDropzone={false}
             getDropRejectMessage={getRejectMessage}
             getFileLimitExceedMessage={getFileLimitExceedMessage}
             getPreviewIcon={getPreviewIcon}
             showAlerts={['error']}
             maxFileSize={maxFileSize}
             initialFiles={defaultValue}
             acceptedFiles={acceptedFiles}
             filesLimit={filesLimit}
             dropzoneText={dropzoneText}
             previewText={previewText}
             onChange={handleFilesChange}
           />
         </DropzoneBox>
       </>
       )
     }
    </>
  )
}
