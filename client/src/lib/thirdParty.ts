declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initGoogleAnalytics(): void {
  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId || document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
}

export function initAdSense(): void {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT;
  if (!clientId || document.getElementById("adsense-script")) return;

  const script = document.createElement("script");
  script.id = "adsense-script";
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

export function initCanonicalUrl(): void {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  if (!siteUrl || document.querySelector('link[rel="canonical"]')) return;

  const link = document.createElement("link");
  link.rel = "canonical";
  link.href = siteUrl;
  document.head.appendChild(link);
}
