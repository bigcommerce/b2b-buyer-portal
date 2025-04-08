import { BigCommerceStorefrontAPIBaseURL } from '@/utils';
import { http, HttpResponse, startMockServer } from 'tests/test-utils';
import { resetPassword } from './resetPassword';

const { server } = startMockServer();

it('passes the email to reset as an "email" param in the request body', async () => {
  const requestSpy = vi.fn();

  server.use(
    http.post(`${BigCommerceStorefrontAPIBaseURL}/login.php`, async ({ request }) => {
      requestSpy(Object.fromEntries(await request.formData()));

      return new HttpResponse(null, { status: 302 });
    }),
  );

  await resetPassword('lee@test.biz');

  expect(requestSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      email: 'lee@test.biz',
    }),
  );
});

it('passes a search param "action" of "send_password_email', async () => {
  const paramsSpy = vi.fn();

  server.use(
    http.post(`${BigCommerceStorefrontAPIBaseURL}/login.php`, async ({ request }) => {
      paramsSpy(Object.fromEntries(new URL(request.url).searchParams));

      return new HttpResponse(null, { status: 302 });
    }),
  );

  await resetPassword('lee@test.biz');

  expect(paramsSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      action: 'send_password_email',
    }),
  );
});

describe('when the login endpoint succeeds', () => {
  it('resolves to undefined', async () => {
    server.use(
      http.post(
        `${BigCommerceStorefrontAPIBaseURL}/login.php`,
        () => new HttpResponse(null, { status: 302 }),
      ),
    );

    await expect(resetPassword('lee@test.biz')).resolves.toBeUndefined();
  });
});

describe('when the login endpoint fails', () => {
  it('rejects to undefined', async () => {
    server.use(
      http.post(`${BigCommerceStorefrontAPIBaseURL}/login.php`, () => HttpResponse.error()),
    );

    await expect(() => resetPassword('lee@test.biz')).rejects.toBeUndefined();
  });
});
