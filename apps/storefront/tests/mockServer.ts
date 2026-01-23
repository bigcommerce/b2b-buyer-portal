import { graphql, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  // Catch all unmocked GraphQL requests and return empty data structure
  graphql.operation(() => {
    return HttpResponse.json({ data: {} });
  }),
  // Catch all unmocked HTTP requests and return empty response
  http.all('*', () => {
    return HttpResponse.json({}, { status: 200 });
  }),
);

export const startMockServer = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => {
    server.resetHandlers();
    server.restoreHandlers();
  });
  afterAll(() => server.close());

  return { server };
};
