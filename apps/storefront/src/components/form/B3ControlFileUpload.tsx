import { useState } from 'react';
import { DropzoneArea, FileObject, PreviewIconProps } from 'react-mui-dropzone';
import {
  CloudUploadOutlined as CloudUploadOutlinedIcon,
  DescriptionRounded,
  ImageRounded as ImageRoundedIcon,
  InsertDriveFileRounded as InsertDriveFileRoundedIcon,
  PictureAsPdfRounded as PictureAsPdfRoundedIcon,
} from '@mui/icons-material';
import { FormLabel, Typography } from '@mui/material';
import isEmpty from 'lodash-es/isEmpty';

import { useB3Lang } from '@/lib/lang';

import { FILE_UPLOAD_ACCEPT_TYPE } from '../../constants';

import { DropzoneBox } from './styled';
import B3UI from './ui';

const defaultLabelColor = '#d32f2f';

const getPreviewIcon = (fileObject: FileObject, classes: PreviewIconProps) => {
  const { type } = fileObject.file;
  const iconProps = {
    className: classes.classes,
  };

  if (type.startsWith('image/')) return <ImageRoundedIcon {...iconProps} />;

  switch (type) {
    case 'application/pdf':
      return <PictureAsPdfRoundedIcon {...iconProps} />;
    // doc docx xls xlsx csv
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'text/csv':
      return <DescriptionRounded {...iconProps} />;
    default:
      return <InsertDriveFileRoundedIcon {...iconProps} />;
  }
};

interface FileUploadProps extends B3UI.B3UIProps {
  acceptedFiles?: string[];
  filesLimit?: number;
  maxFileSize?: number;
  dropzoneText?: string;
  previewText?: string;
  default?: File[];
  labelColor?: string;
  errors?: CustomFieldItems;
  required?: boolean;
}

const getMaxFileSizeLabel = (maxSize: number) => {
  if (maxSize / 1048576 > 1) {
    return `${(maxSize / 1048576).toFixed(1)}MB`;
  }
  if (maxSize / 1024 > 1) {
    return `${(maxSize / 1024).toFixed(1)}KB`;
  }
  return `${maxSize}B`;
};

export function B3ControlFileUpload(props: FileUploadProps) {
  const b3Lang = useB3Lang();

  const {
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    filesLimit = 3,
    maxFileSize = 2097152, // 2M
    dropzoneText = b3Lang('global.fileUpload.defaultText'),
    previewText = ' ',
    fieldType,
    default: defaultValue = [],
    name,
    setValue,
    label,
    labelColor = 'text.primary',
    required,
    errors = {},
    setError,
    control,
  } = props;
  const [deleteCount, setDeleteCount] = useState(0);

  const getRejectMessage = (rejectedFile: File, acceptedFiles: string[], maxFileSize: number) => {
    const { name, size, type } = rejectedFile;

    let isAcceptFileType = false;
    acceptedFiles.forEach((acceptedFileType) => {
      isAcceptFileType = new RegExp(acceptedFileType).test(type) || isAcceptFileType;
    });

    if (!isAcceptFileType) {
      return b3Lang('global.fileUpload.typeNotSupport', {
        name,
      });
    }

    if (size > maxFileSize) {
      return b3Lang('global.fileUpload.namedFileSizeExceedsLimit', {
        name,
        maxSize: getMaxFileSizeLabel(maxFileSize),
      });
    }

    return '';
  };

  const getFileLimitExceedMessage = () =>
    b3Lang('global.fileUpload.fileNumberExceedsLimit', {
      limit: filesLimit,
    });

  const handleFilesChange = (files: File[]) => {
    if (deleteCount > 0 && files.length === 0 && required) {
      setError(name, {
        type: 'required',
        message: b3Lang('global.validate.required', {
          label,
        }),
      });
      setDeleteCount(0);
    }
    if (files.length > 0 && !isEmpty(errors)) {
      const cError = errors[name];
      if (!isEmpty(cError)) {
        delete errors[name];
        // eslint-disable-next-line no-underscore-dangle
        control?._setErrors(errors);
      }
    }
    if (setValue) {
      setValue(name, files);
    }
  };

  return ['files'].includes(fieldType) ? (
    <>
      {label && (
        <FormLabel
          sx={{
            marginBottom: '5px',
            display: 'block',
            color: errors[name] ? defaultLabelColor : labelColor,
          }}
        >
          {`${label} ${required ? '*' : ''}`}
        </FormLabel>
      )}
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
          onDelete={() => setDeleteCount(deleteCount + 1)}
        />
      </DropzoneBox>
      {errors[name] ? (
        <Typography
          sx={{
            color: defaultLabelColor,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: 1.66,
            margin: '3px 14px 0 14px',
          }}
        >
          {errors[name].message}
        </Typography>
      ) : null}
    </>
  ) : null;
}
