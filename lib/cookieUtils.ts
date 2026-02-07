export const setCookie = (name: string, value: string, days = 7) => {
  let cookieString = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (days > 0) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    cookieString += `; expires=${expires}`;
  }
  document.cookie = cookieString;
};

export const getCookie = (name: string) => {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
};

export const removeCookie = (name: string) => {
  setCookie(name, "", -1);
};
