import {
  B3Request,
} from '../../request/b3Fetch'

import {
  RequestType,
} from '../../request/base'
import {
  storeHash,
} from '../../../../utils/basicConfig'

interface UploadFileData {
  file: File,
  type: string
}

export const uploadB2BFile = (data: UploadFileData) => {
  const {
    file,
    type,
  } = data

  const formData = new FormData()
  formData.append('mediaFile', file)
  formData.append('requestType', type) // companyAttachedFile,quoteAttachedFile

  return B3Request.fileUpload('/api/v2/media/upload', formData)
}

export const setChannelStoreType = (channelId: number): CustomFieldItems => B3Request.put('/api/v2/store-configs/channel-storefront-type', RequestType.B2BRest, {
  bcChannelId: channelId,
  storefrontType: 1,
  storeHash,
})
