export const convertObjectToGraphql = (data: CustomFieldItems) => {
  if (typeof data === 'string') {
    return `"${data}"`;
  }
  if (typeof data === 'number') {
    return `${data},`;
  }
  let str = '{';

  Object.keys(data).forEach((item: any, index) => {
    const isLast = index === Object.keys(data).length - 1;
    if (typeof data[item] === 'string') {
      str += `${item}: ${JSON.stringify(`${data[item]}`)}${isLast ? '' : ','} `;
    }

    if (typeof data[item] === 'number') {
      if (index === Object.keys(data).length - 1) {
        str += `${item}: `;
        str += `${data[item]}`;
      } else {
        str += `${item}: `;
        str += `${data[item]}, `;
      }
    }

    if (Object.prototype.toString.call(data[item]) === '[object Object]') {
      str += `${item}: `;
      str += convertObjectToGraphql(data[item]);
    }

    if (Object.prototype.toString.call(data[item]) === '[object Array]') {
      str += `${item}: [`;
      data[item].forEach((list: any, index: number) => {
        str += convertObjectToGraphql(list);
        if (index < data[item].length - 1) {
          str += ',';
        }
      });
      str += '],';
    }
  });
  str += '},';

  return str;
};

export const convertArrayToGraphql = (data: CustomFieldItems) => {
  let str = '[';
  data.forEach((list: CustomFieldItems, index: number) => {
    if (index === data.length - 1) {
      str += convertObjectToGraphql(list);
    } else {
      str += `${convertObjectToGraphql(list)},`;
    }
  });
  str += ']';

  return str;
};
