import {
  Card,
  CardContent,
  Box,
} from '@mui/material'

import {
  useState,
  useEffect,
  useContext,
} from 'react'

import {
  B3CollapseContainer,
} from '@/components'

import {
  B3LStorage,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  FileObjects,
  FileUpload,
} from './FileUpload'

interface QuoteAttachmentProps{
  allowUpload?: boolean,
  defaultFileList?: FileObjects[]
}

export const QuoteAttachment = (props: QuoteAttachmentProps) => {
  const {
    allowUpload = true,
    defaultFileList = [],
  } = props

  const {
    state: {
      customer: {
        firstName = '',
        lastName = '',
      },
    },
  } = useContext(GlobaledContext)

  const [fileList, setFileList] = useState<FileObjects[]>(defaultFileList)

  useEffect(() => {
    if (defaultFileList.length <= 0) {
      const {
        fileInfo = [],
      }: CustomFieldItems = B3LStorage.get('MyQuoteInfo') || {}

      setFileList(typeof fileInfo !== 'object' ? [] : fileInfo)
    }
  }, [])

  const saveQuoteInfo = (newFileInfo: FileObjects[]) => {
    const quoteInfo = B3LStorage.get('MyQuoteInfo') || {}

    if (quoteInfo) {
      B3LStorage.set('MyQuoteInfo', {
        ...quoteInfo,
        fileInfo: newFileInfo,
      })
    }
  }

  const handleChange = (file: FileObjects) => {
    const newFileList = [...fileList, {
      ...file,
      title: `Uploaded by customer: ${firstName} ${lastName}`,
      hasDelete: true,
    }]

    saveQuoteInfo(newFileList)

    setFileList(newFileList)
  }

  const handleDelete = (id: string) => {
    const newFileList = fileList.filter((file) => file.id !== id)

    saveQuoteInfo(newFileList)

    setFileList(newFileList)
  }

  return (
    <Card>
      <CardContent>
        <B3CollapseContainer title="Attachment">
          <Box>
            <FileUpload
              fileList={fileList}
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
