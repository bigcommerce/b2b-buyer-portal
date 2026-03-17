export const Base64 = {
  encode(str: string | number | boolean) {
    return window.btoa(encodeURIComponent(String(str)));
  },
  decode(str: string) {
    return decodeURIComponent(window.atob(str));
  },
};
