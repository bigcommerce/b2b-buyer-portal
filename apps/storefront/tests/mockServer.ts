import { http } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  // hold all http requests that aren't mocked
  http.all('*', () => new Promise<never>(() => {})),
);

export const startMockServer = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => {
    server.resetHandlers();
    server.restoreHandlers();
  });
  afterAll(() => server.close());

  return { server };
};
