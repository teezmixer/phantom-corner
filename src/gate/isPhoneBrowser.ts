// True only for phone browsers, including in-app browsers (Twitter/X, Instagram, Facebook).
// Tablets and desktops return false. Android "Request desktop site" also returns false.
export function isPhoneBrowser(): boolean {
  const ua = navigator.userAgent;
  // Phone user agents: iPhone/iPod, Android with "Mobile", Windows Phone
  const phone = /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua);
  // In-app browsers that always run on phones
  const inApp = /Twitter(for|Android)|Twitter for iPhone|Instagram|FBAN|FBAV/i.test(ua);
  // iPad and Android tablets (no "Mobile") are not phones
  const tablet = /iPad|Tablet/i.test(ua);
  return (phone || inApp) && !tablet;
}
