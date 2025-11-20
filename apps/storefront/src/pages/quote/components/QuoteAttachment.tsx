import { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent } from '@mui/material';

import { B3CollapseContainer } from '@/components';
import { useRole } from '@/hooks/useRole';
import { useB3Lang } from '@/lib/lang';
import { quoteDetailAttachFileCreate, quoteDetailAttachFileDelete } from '@/shared/service/b2b';
import { setDraftQuoteInfo, useAppDispatch, useAppSelector } from '@/store';
import { snackbar } from '@/utils/b3Tip';

import FileUpload, { FileObjects } from './FileUpload';

interface UpLoaddingProps extends HTMLInputElement {
  setUploadLoadding: (flag: boolean) => void;
}

interface QuoteAttachmentProps {
  allowUpload?: boolean;
  defaultFileList?: FileObjects[];
  status?: number;
  quoteId?: number;
}

export default function QuoteAttachment(props: QuoteAttachmentProps) {
  const { allowUpload = true, defaultFileList = [], status, quoteId } = props;
  const b3Lang = useB3Lang();
  const dispatch = useAppDispatch();

  const firstName = useAppSelector(({ company }) => company.customer.firstName);
  const lastName = useAppSelector(({ company }) => company.customer.lastName);
  const draftQuoteInfo = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteInfo);

  const [roleText] = useRole();

  const [fileList, setFileList] = useState<FileObjects[]>([]);

  const uploadRef = useRef<UpLoaddingProps | null>(null);

  useEffect(() => {
    if (status === 0) {
      const { fileInfo = [] }: CustomFieldItems = draftQuoteInfo || {};

      setFileList(typeof fileInfo !== 'object' ? [] : fileInfo);
    } else if (defaultFileList.length) {
      setFileList(defaultFileList);
    }
    // disabling as it throws render errors
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFileList.length, status]);

  const saveQuoteInfo = (newFileInfo: FileObjects[]) => {
    if (draftQuoteInfo) {
      const newQuoteInfo = {
        ...draftQuoteInfo,
        fileInfo: newFileInfo,
      };
      dispatch(setDraftQuoteInfo(newQuoteInfo));
    }
  };

  const handleChange = async (file: FileObjects) => {
    try {
      let newFileList: FileObjects[] = [];
      if (status !== 0) {
        const createFile: FileObjects = {
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
        };
        const {
          quoteAttachFileCreate: { attachFiles },
        } = await quoteDetailAttachFileCreate({
          fileList: [
            {
              ...createFile,
            },
          ],
          quoteId,
        });

        createFile.id = attachFiles[0].id;
        newFileList = [
          {
            ...createFile,
            title: b3Lang('global.quoteAttachment.uploadedByCustomer', {
              createdBy: attachFiles[0].createdBy,
            }),
            hasDelete: true,
          },
          ...fileList,
        ];
      } else {
        newFileList = [
          {
            ...file,
            title: b3Lang('global.quoteAttachment.uploadedByCustomerWithName', {
              firstName,
              lastName,
            }),
            hasDelete: true,
          },
          ...fileList,
        ];

        saveQuoteInfo(newFileList);
      }
      setFileList(newFileList);
    } finally {
      uploadRef.current?.setUploadLoadding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      uploadRef.current?.setUploadLoadding(true);
      const deleteFile = fileList.find((file) => file.id === id);
      const newFileList = fileList.filter((file) => file.id !== id);
      if (status !== 0 && deleteFile) {
        await quoteDetailAttachFileDelete({
          fileId: deleteFile?.id || '',
          quoteId,
        });
      } else {
        saveQuoteInfo(newFileList);
      }
      setFileList(newFileList);
    } finally {
      uploadRef.current?.setUploadLoadding(false);
    }
  };

  const limitUploadFn = () => {
    const customerFiles = fileList.filter(
      (file: FileObjects) => file?.title && file.title.includes('by customer'),
    );
    if (customerFiles.length >= 3) {
      snackbar.error(b3Lang('global.quoteAttachment.maxFilesMessage'));
      return true;
    }
    return false;
  };

  return (
    <Card>
      <CardContent
        sx={{
          p: '16px !important',
        }}
      >
        <B3CollapseContainer title={b3Lang('global.quoteAttachment.title')}>
          <Box>
            <FileUpload
              ref={uploadRef}
              requestType={roleText !== 'b2b' ? 'customerQuoteAttachedFile' : 'quoteAttachedFile'}
              isEndLoadding
              fileList={fileList}
              limitUploadFn={limitUploadFn}
              onchange={handleChange}
              onDelete={handleDelete}
              allowUpload={allowUpload}
            />
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}
