import { B3Request } from '../../request/b3Fetch'

interface UploadFileData {
  file: File,
  type: string
}

export const uploadB2BFile = (data: UploadFileData) => {
  const { file, type } = data

  const formData = new FormData()
  formData.append('mediaFile', file)
  formData.append('requestType', type) // companyAttachedFile,quoteAttachedFile

  return B3Request.fileUpload('/api/v2/media/upload', formData)
}
