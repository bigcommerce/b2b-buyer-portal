import { checkEveryPermissionsCode } from '../b3CheckPermissions';

const setCartPermissions = (isLoggedInAndB2BAccount: boolean) => {
  const purchasbility = checkEveryPermissionsCode({ code: 'purchase_enable' });

  if (!purchasbility && isLoggedInAndB2BAccount) return;
  const style = document.getElementById('b2bPermissions-cartElement-id');
  if (style) {
    style.remove();
  }
};

export default setCartPermissions;
