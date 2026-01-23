import { HttpResponse } from 'msw';

type Params = Record<string, string>;

const log = console;

export const assertQueryParams = (request: Request, params: Params) => {
  const paramEntries = Object.entries(params);
  const { searchParams } = new URL(request.url);

  const allMatched = paramEntries.every(([key, value]) => {
    const paramValue = searchParams.get(key);

    if (paramValue !== value) {
      log.error(
        `
          Query Params: Not match for key ${key}.
          Expected: ${value}
          Received: ${String(paramValue)}`,
      );
    }

    return paramValue === value;
  });

  if (!allMatched) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw HttpResponse.error();
  }

  if (paramEntries.length !== Array.from(searchParams).length) {
    log.error(`
      Query params length did not match.
      Expected: ${String(paramEntries)}
      Received: ${String(Array.from(searchParams))}
      `);

    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw HttpResponse.error();
  }
};
