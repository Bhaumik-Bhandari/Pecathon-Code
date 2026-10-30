import {
  CalendarDays,
  Compass,
  Radar,
  Sparkles,
} from "lucide-react";

export const NAVIGATION_LINKS = [
  {
    label: "Watchtower",
    to: "/watchtower",
    icon: Compass,
    description: "Dark-sky atlas, local weather telemetry & stargazing spots",
    keywords: "watchtower map weather spots night honor score atlas",
  },
  {
    label: "Spirit Lens",
    to: "/spirit-lens",
    icon: Sparkles,
    description: "Deep-sky image denoising, Katana comparison & star catalog",
    keywords: "spirit lens ai astrophotography restore stars katana slider zoom",
  },
  {
    label: "Celestial Scroll",
    to: "/celestial-scroll",
    icon: CalendarDays,
    description: "Lunar calendar, meteor showers, eclipses, ISS & launches",
    keywords: "celestial scroll events moon lunar calendar meteor eclipse iss launch",
  },
  {
    label: "SkyView Radar",
    to: "/skyview-radar",
    icon: Radar,
    description: "Multi-spectrum NASA SkyView telescope telemetry (Optical, IR, X-Ray, Radio)",
    keywords: "skyview radar nasa telescope optical infrared xray radio dss 2mass",
  },
];
