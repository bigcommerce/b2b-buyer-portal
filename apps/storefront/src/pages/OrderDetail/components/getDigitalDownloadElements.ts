import B3Request from '@/shared/service/request/b3Fetch';

type DigitalProductNode = {
  downloadFileUrls: string[];
  downloadPageUrl: string;
  name: string;
  productEntityId: number;
};

type DigitalProduct = {
  node: DigitalProductNode;
};

type DigitalDownloadLineItem = {
  node: {
    name: string;
    downloadPageUrl: string;
    downloadFileUrls: string[];
    productEntityId: number;
  };
};

export type DigitalDownloadElementsResponse = {
  data: {
    site: {
      order: {
        consignments: {
          downloads: Array<{
            lineItems: {
              edges: DigitalDownloadLineItem[];
            };
          }>;
        };
      };
    };
  };
};

const getDigitalDownloadLinks = `
  query GetDigitalDownloadLinks($orderId: Int!) {
    site {
      order(filter: {entityId: $orderId}) {
        consignments {
          downloads {           
            lineItems {
              edges {
                node {
                  name
                  downloadPageUrl
                  downloadFileUrls
                  productEntityId
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const getDigitalDownloadElements = (orderId: number | string): Promise<DigitalProduct[]> =>
  B3Request.graphqlBCProxy({
    query: getDigitalDownloadLinks,
    variables: { orderId },
  }).then((res) => {
    return res.data.site.order.consignments.downloads[0]?.lineItems.edges || [];
  });
