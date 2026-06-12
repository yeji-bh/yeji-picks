"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const AssetCacheBustContext = createContext(0);

export function useAssetCacheBust(): number {
  return useContext(AssetCacheBustContext);
}

/** After bfcache restore, bump version so image URLs get a new query string. */
export default function AssetCacheBustProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [bust, setBust] = useState(0);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setBust((value) => value + 1);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <AssetCacheBustContext.Provider value={bust}>
      {children}
    </AssetCacheBustContext.Provider>
  );
}
