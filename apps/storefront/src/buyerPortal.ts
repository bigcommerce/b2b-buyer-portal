// const str = '<script>
//   window.b3CheckoutConfig = {
//     routes: {
//         dashboard: '/account.php?action=order_status'
//       }
//   }
//   window.B3 = {
//     setting: {
//         'store_hash': `{{settings.store_hash}}`,
//         'b2b_url': 'https://staging-v2.bundleb2b.net',
//           'captcha_setkey': '6LdGN_sgAAAAAGYFg1lmVoakQ8QXxbhWqZ1GpYaJ',
//     },
//       'dom.checkoutRegisterParentElement': '#checkout-app',
//   'dom.registerElement': '[href^="/login.php"], #checkout-customer-login',
//       'dom.openB3Checkout': 'checkout-customer-continue',
//       'before_login_goto_page': '/account.php?action=order_status',
//       'checkout_super_clear_session': 'true',
//       'dom.navUserLoginElement': '.navUser-item.navUser-item--account',

//   }
// </script>

// <script crossorigin src="https://cdn.bundleb2b.net/b2b/staging/storefront/polyfills-legacy.158d896b.js"></script>
// <script crossorigin src="https://cdn.bundleb2b.net/b2b/staging/storefront/index-legacy.40470c56.js"></script>
// '

function init() {
  const insertScript = (scriptString: string) => {
    // const scriptElement = document.createElement('script');
    // scriptElement.innerHTML = scriptString;

    // const {body} = document;

    // body.appendChild(scriptElement);

    document.body.innerHTML += scriptString
  }
  async function getScriptContent(originurl: string) {
    console.log(originurl)
    const xxx = `<script>console.log('test123')</script>
    <script>console.log('test456')</script>
    `

    insertScript(xxx)
    // const queryParams = new URLSearchParams({
    //   url: originurl,
    // });

    // const url = `https://api.example.com/data?${queryParams}`;
    // fetch(url).then(response => {
    //   if (!response.ok) {
    //     throw new Error('Network response was not ok');
    //   }
    //   return response.json();
    // })
    // .then(data => {
    //   console.log(data);

    //   insertScript(data)
    // })
    // .catch(error => {
    //   console.error('There was a problem with the fetch operation:', error);
    // });
  }

  async function analyzeScript() {
    try {
      const { origin } = window.location

      await getScriptContent(origin)
    } catch (error) {
      console.error('Interface error')
    }
  }

  analyzeScript()
}

init()

export {}
