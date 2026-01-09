import { useEffect } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  responsive?: boolean;
  className?: string;
}

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;

export function AdBanner({ 
  slot, 
  format = "auto", 
  responsive = true,
  className = "" 
}: AdBannerProps) {
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  if (!ADSENSE_CLIENT) return null;

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}

export function TopBannerAd() {
  const slot = import.meta.env.VITE_ADSENSE_SLOT_TOP;
  if (!slot) return null;
  return (
    <AdBanner 
      slot={slot}
      format="auto"
      className="my-4"
    />
  );
}

export function SidebarAd() {
  const slot = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR;
  if (!slot) return null;
  return (
    <AdBanner 
      slot={slot}
      format="rectangle"
      responsive={false}
      className="sticky top-4"
    />
  );
}

export function InFeedAd() {
  const slot = import.meta.env.VITE_ADSENSE_SLOT_INFEED;
  if (!slot) return null;
  return (
    <AdBanner 
      slot={slot}
      format="fluid"
      className="my-6"
    />
  );
}
