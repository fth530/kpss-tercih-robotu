import { useEffect } from "react";

const BASE_TITLE = "KPSS Tercih Robotu";

export function usePageTitle(title?: string) {
    useEffect(() => {
        const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} - Kadro Arama | 2025/2 Güncel`;
        document.title = fullTitle;

        // Also update OG title meta tag
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute("content", fullTitle);
        }

        return () => {
            // Reset to default on unmount
            document.title = `${BASE_TITLE} - Kadro Arama | 2025/2 Güncel`;
        };
    }, [title]);
}
