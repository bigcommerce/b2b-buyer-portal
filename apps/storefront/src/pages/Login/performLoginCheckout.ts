import { loginCheckout, LoginConfig } from './helper';

type CheckoutResult = 'resetPassword' | 'accountIncorrect' | 'success';

export async function performLoginCheckout(loginData: LoginConfig): Promise<CheckoutResult> {
  const response = await loginCheckout(loginData);

  if (response.status === 400 && response.type === 'reset_password_before_login') {
    return 'resetPassword';
  }
  if (response.type === 'invalid_login') {
    return 'accountIncorrect';
  }
  return 'success';
}
