import { channelId, storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

interface UploadFileData {
  file: File;
  type: string;
}

interface ProductPriceOption {
  option_id: number;
  value_id: number;
}

interface ProductPriceItem {
  product_id: number;
  variant_id: number;
  options: Partial<ProductPriceOption>[];
}

interface ProductPrice {
  storeHash: string;
  channel_id: number;
  currency_code: string;
  items: Partial<ProductPriceItem>[];
  customer_group_id: number;
}

export const uploadB2BFile = (data: UploadFileData) => {
  const { file, type } = data;

  const formData = new FormData();
  formData.append('mediaFile', file);
  formData.append('requestType', type); // companyAttachedFile,quoteAttachedFile

  return B3Request.fileUpload('/api/v2/media/upload', formData);
};

export const setChannelStoreType = () =>
  B3Request.put('/api/v2/store-configs/channel-storefront-type', RequestType.B2BRest, {
    bcChannelId: channelId,
    storefrontType: 1,
    storeHash,
  });

export const getProductPricing = (data: Partial<ProductPrice>) =>
  B3Request.post('/api/v2/bc/pricing/products', RequestType.B2BRest, data);
