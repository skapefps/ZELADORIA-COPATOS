import { useEffect, useState } from "react";

type BrandColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};

export type BrandPreset = {
  appName: string;
  shortName: string;
  organizationName: string;
  adminTitle: string;
  tagline: string;
  logoSrc: string;
  faviconSrc: string;
  colors: BrandColors;
};

export const defaultBrandPreset: BrandPreset = {
  appName: "Zeladoria Coopatos",
  shortName: "Zeladoria",
  organizationName: "Coopatos",
  adminTitle: "Painel Administrativo",
  tagline: "Sempre presente!",
  logoSrc: "/logo-coopatos.png",
  faviconSrc: "/logo-coopatos.png",
  colors: {
    background: "210 20% 97%",
    foreground: "213 56% 24%",
    card: "0 0% 100%",
    cardForeground: "213 56% 24%",
    primary: "213 56% 24%",
    primaryForeground: "0 0% 100%",
    secondary: "73 75% 43%",
    secondaryForeground: "0 0% 100%",
    muted: "210 20% 93%",
    mutedForeground: "213 20% 46%",
    accent: "73 75% 93%",
    accentForeground: "213 56% 24%",
    border: "213 20% 88%",
    input: "213 20% 88%",
    ring: "213 56% 24%",
    sidebarBackground: "213 56% 24%",
    sidebarForeground: "0 0% 95%",
    sidebarPrimary: "73 75% 43%",
    sidebarPrimaryForeground: "0 0% 100%",
    sidebarAccent: "213 56% 30%",
    sidebarAccentForeground: "0 0% 95%",
    sidebarBorder: "213 40% 32%",
    sidebarRing: "73 75% 43%",
  },
};

export const brandPreset = defaultBrandPreset;

const BRAND_STORAGE_KEY = "coopatos-brand-preset";
const BRAND_CHANGE_EVENT = "coopatos-brand-change";
const API_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
    "https://zeladoria-coopatos-api.onrender.com";

const colorVariables: Record<keyof BrandColors, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebarBackground: "--sidebar-background",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

export const applyBrandPreset = (preset = brandPreset) => {
  const root = document.documentElement;

  Object.entries(preset.colors).forEach(([key, value]) => {
    root.style.setProperty(colorVariables[key as keyof BrandColors], value);
  });

  document.title = preset.appName;

  const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

  if (favicon) {
    favicon.href = preset.faviconSrc;
  }
};

export const mergeBrandPreset = (preset?: Partial<BrandPreset> | null): BrandPreset => ({
  ...defaultBrandPreset,
  ...(preset || {}),
  colors: {
    ...defaultBrandPreset.colors,
    ...(preset?.colors || {}),
  },
});

export const getStoredBrandPreset = () => {
  try {
    const stored = localStorage.getItem(BRAND_STORAGE_KEY);
    return stored ? mergeBrandPreset(JSON.parse(stored)) : defaultBrandPreset;
  } catch {
    return defaultBrandPreset;
  }
};

export const saveBrandPreset = (preset: BrandPreset) => {
  const merged = mergeBrandPreset(preset);
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(merged));
  applyBrandPreset(merged);
  window.dispatchEvent(new CustomEvent(BRAND_CHANGE_EVENT, { detail: merged }));
  return merged;
};

export const syncBrandPresetFromServer = async () => {
  try {
    const response = await fetch(`${API_URL}/brand-settings`);
    const data = await response.json();

    if (!response.ok || !data?.preset) return getStoredBrandPreset();

    return saveBrandPreset(mergeBrandPreset(data.preset));
  } catch {
    return getStoredBrandPreset();
  }
};

export const resetBrandPreset = () => {
  localStorage.removeItem(BRAND_STORAGE_KEY);
  applyBrandPreset(defaultBrandPreset);
  window.dispatchEvent(
    new CustomEvent(BRAND_CHANGE_EVENT, { detail: defaultBrandPreset })
  );
  return defaultBrandPreset;
};

export const useBranding = () => {
  const [preset, setPreset] = useState<BrandPreset>(() => getStoredBrandPreset());

  useEffect(() => {
    applyBrandPreset(preset);

    const handleBrandChange = (event: Event) => {
      setPreset((event as CustomEvent<BrandPreset>).detail || getStoredBrandPreset());
    };

    window.addEventListener(BRAND_CHANGE_EVENT, handleBrandChange);
    window.addEventListener("storage", handleBrandChange);

    return () => {
      window.removeEventListener(BRAND_CHANGE_EVENT, handleBrandChange);
      window.removeEventListener("storage", handleBrandChange);
    };
  }, [preset]);

  return {
    brandPreset: preset,
    saveBrandPreset,
    resetBrandPreset,
    defaultBrandPreset,
  };
};

export const hexToHslString = (hex: string) => {
  const normalized = hex.replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized
        .split("")
        .map((item) => item + item)
        .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
};

export const hslStringToHex = (value: string) => {
  const [hValue, sValue, lValue] = value.replace(/%/g, "").split(/\s+/);
  const h = Number(hValue) / 360;
  const s = Number(sValue) / 100;
  const l = Number(lValue) / 100;

  if ([h, s, l].some(Number.isNaN)) return "#000000";

  const hueToRgb = (p: number, q: number, t: number) => {
    let nextT = t;
    if (nextT < 0) nextT += 1;
    if (nextT > 1) nextT -= 1;
    if (nextT < 1 / 6) return p + (q - p) * 6 * nextT;
    if (nextT < 1 / 2) return q;
    if (nextT < 2 / 3) return p + (q - p) * (2 / 3 - nextT) * 6;
    return p;
  };

  let r = l;
  let g = l;
  let b = l;

  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  const toHex = (channel: number) =>
    Math.round(channel * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
