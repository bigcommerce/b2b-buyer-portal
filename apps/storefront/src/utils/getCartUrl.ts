export default function getCartUrl() {
  const {
    setting: { platform, cart_url: cartUrl },
  } = window.B3;
  const fallbackValue = platform === 'bigcommerce' ? '/cart.php' : '/cart';

  return cartUrl || fallbackValue;
}
