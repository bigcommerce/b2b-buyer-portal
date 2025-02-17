import { useState } from 'react';
import { Control, FieldError, FieldErrors } from 'react-hook-form';
import { DropzoneArea, FileObject, PreviewIconProps } from 'react-mui-dropzone';
import { useB3Lang } from '@b3/lang';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { FormLabel, Typography } from '@mui/material';
import isEmpty from 'lodash-es/isEmpty';

import { FILE_UPLOAD_ACCEPT_TYPE } from '../../constants';

import { DropzoneBox } from './styled';

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
    // cspell:disable
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'text/csv':
      // cspell:enable
      return <DescriptionRounded {...iconProps} />;
    default:
      return <InsertDriveFileRoundedIcon {...iconProps} />;
  }
};

const getMaxFileSizeLabel = (maxSize: number) => {
  if (maxSize / 1048576 > 1) {
    return `${(maxSize / 1048576).toFixed(1)}MB`;
  }
  if (maxSize / 1024 > 1) {
    return `${(maxSize / 1024).toFixed(1)}KB`;
  }
  return `${maxSize}B`;
};

export interface FileUploadProps {
  control?: Control;
  name: string;
  setValue?: (name: string, value: File[]) => void;
  label: string;
  acceptedFiles?: string[];
  filesLimit?: number;
  maxFileSize?: number;
  dropzoneText?: string;
  previewText?: string;
  default?: File[];
  labelColor?: string;
  setError: (name: string, error: FieldError) => void;
  errors: FieldErrors;
  required?: boolean;
}

export default function B3ControlFileUpload(props: FileUploadProps) {
  const b3Lang = useB3Lang();

  const {
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    filesLimit = 3,
    maxFileSize = 2097152, // 2M
    dropzoneText = b3Lang('global.fileUpload.defaultText'),
    previewText = ' ',
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

  const fieldError = errors[name];

  return (
    <>
      {label && (
        <FormLabel
          sx={{
            marginBottom: '5px',
            display: 'block',
            color: fieldError ? defaultLabelColor : labelColor,
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
      {fieldError ? (
        <Typography
          sx={{
            color: defaultLabelColor,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: 1.66,
            margin: '3px 14px 0 14px',
          }}
        >
          {fieldError.message?.toString()}
        </Typography>
      ) : null}
    </>
  );
}
