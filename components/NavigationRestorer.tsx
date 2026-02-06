"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const STORAGE_KEY = "celebfit_last_path";
// Paths to ignore when saving history
const IGNORED_PATHS = ["/payment/success", "/api"];

export function NavigationRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Restoration Logic (Run once on mount)
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const storedPath = sessionStorage.getItem(STORAGE_KEY);
    if (!storedPath) return;

    // 1. Handle Stripe Cancel Redirect
    // If user cancelled payment and returned to options, send them back to where they started (e.g. Premium page)
    if (pathname === "/onboarding/options" && searchParams.get("canceled") === "true") {
      // Avoid redirect loops if stored path is same as current or invalid
      if (storedPath !== pathname && storedPath.startsWith("/")) {
        router.replace(storedPath);
      }
      return;
    }

    // 2. Handle Root Visit (Session Restore)
    // If user reopens tab or lands on root, restore their last position
    if (pathname === "/") {
      if (storedPath !== "/" && storedPath.startsWith("/")) {
        router.replace(storedPath);
      }
    }
  }, [pathname, searchParams, router]);

  // Saving Logic (Run on path change)
  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    // If payment was successful, clear history to prevent redirect loops back to checkout/premium
    if (pathname.includes("/payment/success")) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Don't save ignored paths
    if (IGNORED_PATHS.some((path) => pathname.startsWith(path))) return;

    // Construct full path with search params
    const fullPath =
      searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;

    sessionStorage.setItem(STORAGE_KEY, fullPath);
  }, [pathname, searchParams]);

  return null;
}
