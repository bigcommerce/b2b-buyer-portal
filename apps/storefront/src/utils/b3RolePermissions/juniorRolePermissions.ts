const setCartPermissions = (role: number | string) => {
  if (+role === 2) return;
  const style = document.getElementById('b2bPermissions-cartElement-id');
  if (style) {
    style.remove();
  }
};

export default setCartPermissions;
