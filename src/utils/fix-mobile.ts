export function fixMobile(mobile: string) {
  if (mobile.length === 10 && mobile.startsWith('09')) return mobile;

  let fixedMobile: string = '0' + mobile.substring(3);
  console.log(fixedMobile);
  return fixedMobile;
}
