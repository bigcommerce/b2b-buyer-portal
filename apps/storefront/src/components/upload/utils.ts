export const removeEmptyRow = (arr: string[]) => {
  const tmpArr = arr;
  if (tmpArr[tmpArr.length - 1] === '') {
    tmpArr.pop();
  }
  tmpArr.shift();

  return tmpArr;
};

export interface ParseEmptyDataProps {
  sku: string;
  qty: string;
}

export const parseEmptyData = (arr: string[]): ParseEmptyDataProps[] => {
  if (arr.length) {
    const tmpArr = arr.map((item: string) => {
      const products = item.split(',');
      return {
        sku: products[0],
        qty: products[1]?.replace(/[\r\n]/g, ''),
      };
    });
    return tmpArr;
  }
  return [];
};

export const isFileExtension = (fileType: string): fileType is `.${string}` => {
  return fileType.startsWith('.');
};
