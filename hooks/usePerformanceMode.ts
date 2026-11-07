import { useState, useEffect } from "react";

export function usePerformanceMode() {
  const [canRender3D, setCanRender3D] = useState<boolean>(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState<boolean>(false);

  useEffect(() => {
    const savedPref = localStorage.getItem("pustakakita_low_bw");
    if (savedPref !== null) {
      const forcedLow = savedPref === "true";
      setIsLowBandwidth(forcedLow);
      setCanRender3D(!forcedLow && window.innerWidth >= 1024);
      return;
    }

    // 1. Cek ukuran layar (Mobile otomatis 2D)
    const isDesktopOrLargeTablet = window.innerWidth >= 1024;

    // 2. Cek preferensi Reduced Motion OS
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 3. Cek Network Information API (Mode Hemat Data / Koneksi 2G-3G)
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    const saveData = nav.connection?.saveData === true;
    const slowConnection =
      nav.connection?.effectiveType === "slow-2g" ||
      nav.connection?.effectiveType === "2g" ||
      nav.connection?.effectiveType === "3g";

    // 4. Cek RAM Perangkat (Jika < 4GB, matikan 3D otomatis)
    const lowMemory =
      nav.deviceMemory !== undefined && nav.deviceMemory < 4;

    const lowBwDetected = saveData || slowConnection || lowMemory;
    setIsLowBandwidth(lowBwDetected);

    if (isDesktopOrLargeTablet && !prefersReducedMotion && !lowBwDetected) {
      setCanRender3D(true);
    } else {
      setCanRender3D(false);
    }
  }, []);

  const toggleLowBandwidth = (value: boolean) => {
    setIsLowBandwidth(value);
    localStorage.setItem("pustakakita_low_bw", String(value));
    if (value) {
      setCanRender3D(false);
    } else if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setCanRender3D(true);
    }
  };

  return {
    canRender3D,
    isLowBandwidth,
    setCanRender3D,
    toggleLowBandwidth,
  };
}

