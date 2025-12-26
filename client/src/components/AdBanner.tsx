import { useEffect } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  responsive?: boolean;
  className?: string;
}

export function AdBanner({ 
  slot, 
  format = "auto", 
  responsive = true,
  className = "" 
}: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Buraya kendi AdSense ID'ni koy
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}

// Farklı reklam tipleri için hazır bileşenler
export function TopBannerAd() {
  return (
    <AdBanner 
      slot="1234567890" // Kendi slot ID'ni koy
      format="auto"
      className="my-4"
    />
  );
}

export function SidebarAd() {
  return (
    <AdBanner 
      slot="0987654321" // Kendi slot ID'ni koy
      format="rectangle"
      responsive={false}
      className="sticky top-4"
    />
  );
}

export function InFeedAd() {
  return (
    <AdBanner 
      slot="1122334455" // Kendi slot ID'ni koy
      format="fluid"
      className="my-6"
    />
  );
}
