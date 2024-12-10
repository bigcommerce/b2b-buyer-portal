import { RequestType } from '@/shared/service/request/base';

// TODO: Old logic - remove
const queryParse = <T>(query: T): string => {
  let queryText = '';

  Object.keys(query || {}).forEach((key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryText += `${key}=${(query as any)[key]}&`;
  });
  return queryText.slice(0, -1);
};

describe('queryParse', () => {
  it('should stringify objects', () => {
    const params = {
      foo: 'bar',
      hello: 'world',
    };
    const output = queryParse(params);

    expect(output).toMatchInlineSnapshot(`"foo=bar&hello=world"`);

    const newLogic = new URLSearchParams(params);

    expect(newLogic.toString()).toMatchInlineSnapshot(`"foo=bar&hello=world"`);

    expect(output).toMatch(newLogic.toString());
  });
});

describe('enum should use typeof keyof for function argument type', () => {
  it('should accept enum so that types are checked properly', () => {
    const validFunction = (type: RequestType) => {
      if (type === RequestType.B2BGraphql) {
        return true;
      }
      return false;
    };

    const alsoValidFunction = (type: keyof typeof RequestType) => {
      if (type === RequestType.B2BGraphql) {
        return true;
      }
      return false;
    };

    expect(validFunction(RequestType.B2BGraphql)).toBe(true);
    expect(alsoValidFunction(RequestType.B2BGraphql)).toBe(true);
    // @ts-expect-error typescript should complain but javascript output should still work
    expect(validFunction('B2BGraphql')).toBe(true);
    expect(alsoValidFunction('B2BGraphql')).toBe(true);
  });
});
