import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Automatically scrolls the browser window to top (0, 0) whenever the route location changes.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Instant scroll to top on any navigation
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [location]);

  return null;
}
