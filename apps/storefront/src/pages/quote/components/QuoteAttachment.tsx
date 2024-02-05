import { useContext, useEffect, useRef, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box, Card, CardContent } from '@mui/material'

import { B3CollapseContainer } from '@/components'
import { useRole } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  quoteDetailAttachFileCreate,
  quoteDetailAttachFileDelete,
} from '@/shared/service/b2b'
import { B3LStorage, snackbar } from '@/utils'

import FileUpload, { FileObjects } from './FileUpload'

interface UpLoaddingProps extends HTMLInputElement {
  setUploadLoadding: (flag: boolean) => void
}

interface QuoteAttachmentProps {
  allowUpload?: boolean
  defaultFileList?: FileObjects[]
  status?: number
  quoteId?: number
}

export default function QuoteAttachment(props: QuoteAttachmentProps) {
  const { allowUpload = true, defaultFileList = [], status, quoteId } = props
  const b3Lang = useB3Lang()

  const {
    state: {
      customer: { firstName = '', lastName = '' },
    },
  } = useContext(GlobaledContext)

  const [roleText] = useRole()

  const [fileList, setFileList] = useState<FileObjects[]>([])

  const uploadRef = useRef<UpLoaddingProps | null>(null)

  useEffect(() => {
    if (status === 0) {
      const { fileInfo = [] }: CustomFieldItems =
        B3LStorage.get('MyQuoteInfo') || {}

      setFileList(typeof fileInfo !== 'object' ? [] : fileInfo)
    } else if (defaultFileList.length) {
      setFileList(defaultFileList)
    }
  }, [status])

  const saveQuoteInfo = (newFileInfo: FileObjects[]) => {
    const quoteInfo = B3LStorage.get('MyQuoteInfo') || {}

    if (quoteInfo) {
      B3LStorage.set('MyQuoteInfo', {
        ...quoteInfo,
        fileInfo: newFileInfo,
      })
    }
  }

  const handleChange = async (file: FileObjects) => {
    try {
      let newFileList: FileObjects[] = []
      if (status !== 0) {
        const createFile: FileObjects = {
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
        }
        const {
          quoteAttachFileCreate: { attachFiles },
        } = await quoteDetailAttachFileCreate({
          fileList: [
            {
              ...createFile,
            },
          ],
          quoteId,
        })

        createFile.id = attachFiles[0].id
        newFileList = [
          {
            ...createFile,
            title: b3Lang('global.quoteAttachment.uploadedByCustomer', {
              createdBy: attachFiles[0].createdBy,
            }),
            hasDelete: true,
          },
          ...fileList,
        ]
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
        ]

        saveQuoteInfo(newFileList)
      }
      setFileList(newFileList)
    } finally {
      uploadRef.current?.setUploadLoadding(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      uploadRef.current?.setUploadLoadding(true)
      const deleteFile = fileList.find((file) => file.id === id)
      const newFileList = fileList.filter((file) => file.id !== id)
      if (status !== 0 && deleteFile) {
        await quoteDetailAttachFileDelete({
          fileId: deleteFile?.id || '',
          quoteId,
        })
      } else {
        saveQuoteInfo(newFileList)
      }
      setFileList(newFileList)
    } finally {
      uploadRef.current?.setUploadLoadding(false)
    }
  }

  const limitUploadFn = () => {
    const customerFiles = fileList.filter(
      (file: FileObjects) => file?.title && file.title.includes('by customer')
    )
    if (customerFiles.length >= 3) {
      snackbar.error(b3Lang('global.quoteAttachment.maxFilesMessage'))
      return true
    }
    return false
  }

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
              requestType={
                roleText !== 'b2b'
                  ? 'customerQuoteAttachedFile'
                  : 'quoteAttachedFile'
              }
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
  )
}
