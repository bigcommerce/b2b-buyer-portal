import { http, HttpResponse, startMockServer } from 'tests/test-utils';

import { getAPIBaseURL } from '@/shared/service/request/base';

import { initHeadlessScripts } from '../src/utils/headlessInitializer';

vi.mock('@/utils/b3Logger', () => ({ default: { error: vi.fn() } }));

const { server } = startMockServer();

describe('when headless.ts is run', () => {
  it('should request the storefront script', async () => {
    const serverMock = vi.fn();

    server.use(
      http.post(`${getAPIBaseURL()}/graphql`, async ({ request }) => {
        serverMock(await request.text());

        return HttpResponse.json({
          data: {
            storefrontScript: {
              script:
                '<script>\n window.b3CheckoutConfig = {\n routes: {\n dashboard: "/account.php?action=order_status",\n },\n };\n window.B3 = {\n setting: {\n store_hash: "store_hash",\n channel_id: 1,\n platform: "bigcommerce",\n b2b_client_id: "b2b_client_id",\n b2b_url: "https://api-b2b.bigcommerce.com",\n captcha_site_key: "xyz",\n },\n "dom.checkoutRegisterParentElement": "#checkout-app",\n };\n</script>\n<script type="module" crossorigin src="https://microapps.bigcommerce.com/b2b-buyer-portal/storefront/index.wVqliJs9.js"></script>\n<script nomodule crossorigin src="https://microapps.bigcommerce.com/b2b-buyer-portal/storefront/polyfills-legacy.DArz4FPZ.js"></script>\n<script nomodule crossorigin src="https://microapps.bigcommerce.com/b2b-buyer-portal/storefront/index-legacy.BwHISVUB.js"></script>\n',
            },
          },
        });
      }),
    );

    await initHeadlessScripts();

    expect(serverMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "{"query":"\\n          {\\n            storefrontScript(\\n              storeHash: \\"\\"\\n              channelId: \\n              siteUrl: \\"http://localhost\\"\\n            ) {\\n              script\\n              storeHash\\n              channelId\\n            }\\n          }"}",
      ]
    `);

    expect(document.body.innerHTML).toMatchInlineSnapshot(`
      "<script class="buyer-portal-scripts-headless">
       window.b3CheckoutConfig = {
       routes: {
       dashboard: "/account.php?action=order_status",
       },
       };
       window.B3 = {
       setting: {
       store_hash: "store_hash",
       channel_id: 1,
       platform: "bigcommerce",
       b2b_client_id: "b2b_client_id",
       b2b_url: "https://api-b2b.bigcommerce.com",
       captcha_site_key: "xyz",
       },
       "dom.checkoutRegisterParentElement": "#checkout-app",
       };
      </script><script type="module" crossorigin="" src="https://microapps.bigcommerce.com/b2b-buyer-portal/storefront/index.wVqliJs9.js" class="buyer-portal-scripts-headless"></script><script nomodule="" crossorigin="" src="https://microapps.bigcommerce.com/b2b-buyer-portal/storefront/polyfills-legacy.DArz4FPZ.js" class="buyer-portal-scripts-headless"></script><script nomodule="" crossorigin="" src="https://microapps.bigcommerce.com/b2b-buyer-portal/storefront/index-legacy.BwHISVUB.js" class="buyer-portal-scripts-headless"></script>"
    `);

    // calling again to make sure the old scripts get replaced properly
    // i.e there should not be duplicate scripts
    await initHeadlessScripts();

    expect(document.body.querySelectorAll('script.buyer-portal-scripts-headless')).toHaveLength(4);
  });
});
