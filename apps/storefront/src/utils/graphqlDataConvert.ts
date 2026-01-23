import { camelCase, isArray, isObject, isPlainObject, snakeCase } from 'lodash-es';

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
      str += `${item}: ${JSON.stringify(data[item])}${isLast ? '' : ','} `;
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

// Define the types that can be converted.
type ConvertibleTypes = string | Record<string, any> | any[];

/**
 * Converts a given string from camel case to snake case.
 * @param str The string to be converted.
 * @returns The converted string.
 */
function camelToSnake(str: string): string {
  return snakeCase(str);
}

/**
 * Converts a given string from snake case to camel case.
 * @param str The string to be converted.
 * @returns The converted string.
 */
function snakeToCamel(str: string): string {
  return camelCase(str);
}

/**
 * Recursively converts the keys of an object or array from camel case to snake case.
 * @param input The object or array to be converted.
 * @returns A new object or array with keys in snake case.
 */
export function convertObjectOrArrayKeysToSnake(input: ConvertibleTypes): ConvertibleTypes {
  if (typeof input === 'string') {
    return input;
  }

  if (isArray(input)) {
    return input.map((item: ConvertibleTypes) => convertObjectOrArrayKeysToSnake(item));
  }

  if (isObject(input) && !isPlainObject(input)) {
    // Handle special cases like Date or RegExp objects
    return input;
  }

  if (isPlainObject(input)) {
    const result: Record<string, any> = {};

    Object.keys(input).forEach((key) => {
      result[camelToSnake(key)] = convertObjectOrArrayKeysToSnake((input as CustomFieldItems)[key]);
    });

    return result;
  }

  return input;
}

/**
 * Recursively converts the keys of an object or array from snake case to camel case.
 * @param input The object or array to be converted.
 * @returns A new object or array with keys in camel case.
 */
export function convertObjectOrArrayKeysToCamel(input: ConvertibleTypes): ConvertibleTypes {
  if (typeof input === 'string') {
    return input;
  }

  if (isArray(input)) {
    return input.map((item: ConvertibleTypes) => convertObjectOrArrayKeysToCamel(item));
  }

  if (isObject(input) && !isPlainObject(input)) {
    // Handle special cases like Date or RegExp objects
    return input;
  }

  if (isPlainObject(input)) {
    const result: Record<string, any> = {};

    Object.keys(input).forEach((key) => {
      result[snakeToCamel(key)] = convertObjectOrArrayKeysToCamel((input as CustomFieldItems)[key]);
    });

    return result;
  }

  return input;
}
