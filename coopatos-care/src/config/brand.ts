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

export const brandPreset: BrandPreset = {
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
