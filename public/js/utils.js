function deleteAllCookies() {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

// util function to parse local cookie
function cookie2obj(str) {
  str = str.split('; ');
  let result = {};
  for (let i = 0; i < str.length; i++) {
    const cur = str[i].split('=');
    result[cur[0]] = decodeURIComponent(cur[1]);
  }
  return result;
}

function adjustScroll(el, speed=500) {
  // console.log(`adjusting scroll for: ${el}`);
  $(el).each((i, e) => {
    $(e).animate({ scrollTop: $(e).prop("scrollHeight")}, speed);
  });
}

export { deleteAllCookies, cookie2obj, adjustScroll };
