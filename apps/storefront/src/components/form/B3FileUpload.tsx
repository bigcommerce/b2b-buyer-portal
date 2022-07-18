import { Box, FormControl } from '@mui/material'
import { styled } from '@mui/material/styles'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'

import { Controller } from 'react-hook-form'

import {
  DropzoneArea,
  FileObject,
  PreviewIconProps,
} from 'react-mui-dropzone'

import { FILE_UPLOAD_ACCEPT_TYPE } from '../../constants'

import B3UI from './ui'

const DropzoneBox = styled(Box)(() => ({
  '& .MuiDropzoneArea-textContainer': {
    border: '2px dotted #3C64F4',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& .MuiTypography-root': {
      fontSize: '1rem',
      color: '#767676',
      order: 1,
    },
    '& .MuiSvgIcon-root': {
      color: '#D1D1D1',
      fontSize: '3rem',
      marginRight: '0.5rem',
    },
  },
  '& .MuiGrid-container': {
    margin: 0,
    width: '100%',
    '& .MuiGrid-item': {
      maxWidth: '120px',
      flexBasis: '120px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: '4px',
      margin: '20px 20px 0 0',
      boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
      position: 'relative',
      '& .MuiSvgIcon-root': {
        color: '#757575',
        fontSize: '40px',
      },
      '& .MuiTypography-root': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        fontSize: '1rem',
        marginTop: '10px',
        textAlign: 'center',
      },
      '& .MuiButtonBase-root': {
        position: 'absolute',
        top: '-12px',
        right: '-12px',
        width: '24px',
        height: '24px',
        minHeight: 'inherit',
        backgroundColor: '#757575',
        boxShadow: 'none',
        '& .MuiSvgIcon-root': {
          color: '#fff',
          fontSize: '16px',
        },
      },
    },
  },
  '& #client-snackbar': {
    '& .MuiSvgIcon-root': {
      verticalAlign: 'middle',
      marginRight: '4px',
    },
  },
}))

const getPreviewIcon = (fileObject: FileObject, classes: PreviewIconProps) => {
  const { type } = fileObject.file
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
  default?: any,
  onChange?: (files: File[]) => void
}

export const B3FileUpload = (props: FileUploadProps) => {
  const {
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    filesLimit = 3,
    maxFileSize = 2097152, // 2M
    dropzoneText = 'Drag & drop file here or browse',
    previewText = ' ',
    control,
    fieldType,
    default: defaultValue = [],
    name,
    required,
    label,
    validate,
  } = props

  const fieldsProps = {
    type: fieldType,
    name,
    key: name,
    defaultValue,
    rules: {
      required: required && `${label} is required`,
      validate,
    },
    control,
  }

  const getRejectMessage = (
    rejectedFile: File,
    acceptedFiles: string[],
    maxFileSize: number,
  ) => {
    const { name, size, type } = rejectedFile

    let isAcceptFileType = false
    acceptedFiles.forEach((acceptedFileType) => {
      isAcceptFileType = new RegExp(acceptedFileType).test(type) || isAcceptFileType
    })

    if (!isAcceptFileType) {
      return `${name} file type not support`
    }

    if (size > maxFileSize) {
      return `${name} file exceeds the limit`
    }

    return ''
  }

  const getFileLimitExceedMessage = () => `The number of files exceeds the limit, with up to ${filesLimit} being supported`

  return (
    <>
      {
       ['file'].includes(fieldType) && (
         <FormControl
           sx={{
             width: '100%',
           }}
         >
           <Controller
             {...fieldsProps}
             render={({ field: { ref, ...rest } }) => (
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
                   {...rest}
                 />
               </DropzoneBox>
             )}
           />
         </FormControl>
       )
     }
    </>
  )
}
