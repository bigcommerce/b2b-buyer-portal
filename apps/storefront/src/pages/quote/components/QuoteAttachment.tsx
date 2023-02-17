import {
  Card,
  CardContent,
  Box,
} from '@mui/material'

import {
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react'

import {
  B3CollapseContainer,
} from '@/components'

import {
  B3LStorage,
  snackbar,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  quoteDetailAttachFileCreate,
  quoteDetailAttachFileDelete,
} from '@/shared/service/b2b'

import FileUpload, {
  FileObjects,
} from './FileUpload'

interface UpLoaddingProps extends HTMLInputElement {
  setUploadLoadding: (flag: boolean) => void
}

interface QuoteAttachmentProps{
  allowUpload?: boolean,
  defaultFileList?: FileObjects[]
  status?: number
  quoteId?: number
}

export const QuoteAttachment = (props: QuoteAttachmentProps) => {
  const {
    allowUpload = true,
    defaultFileList = [],
    status,
    quoteId,
  } = props

  const {
    state: {
      customer: {
        firstName = '',
        lastName = '',
      },
    },
  } = useContext(GlobaledContext)

  const [fileList, setFileList] = useState<FileObjects[]>([])

  // useEffect(() => {
  //   setFileList(defaultFileList)
  // }, [defaultFileList])

  const uploadRef = useRef<UpLoaddingProps | null>(null)

  useEffect(() => {
    if (status === 0) {
      const {
        fileInfo = [],
      }: CustomFieldItems = B3LStorage.get('MyQuoteInfo') || {}

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
          quoteAttachFileCreate: {
            attachFiles,
          },
        } = await quoteDetailAttachFileCreate({
          fileList: [{
            ...createFile,
          }],
          quoteId,
        })

        createFile.id = attachFiles[0].id
        newFileList = [{
          ...createFile,
          title: `Uploaded by customer: ${attachFiles[0].createdBy}`,
          hasDelete: true,
        }, ...fileList]
      } else {
        newFileList = [{
          ...file,
          title: `Uploaded by customer: ${firstName} ${lastName}`,
          hasDelete: true,
        }, ...fileList]

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
    const customerFiles = fileList.filter((file: FileObjects) => file?.title && file.title.includes('by customer'))
    if (customerFiles.length >= 3) {
      snackbar.error('You can add up to 3 files')
      return true
    }
    return false
  }

  return (
    <Card>
      <CardContent>
        <B3CollapseContainer title="Attachment">
          <Box>
            <FileUpload
              ref={uploadRef}
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
