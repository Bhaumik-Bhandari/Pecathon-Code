import {
  Blocks,
  ClipboardList,
  Database,
  PanelsTopLeft,
} from "lucide-react";

export const dashboardStats = [
  {
    title: "Reusable UI pieces",
    value: "05",
    description: "Shared components created",
    icon: Blocks,
    tone: "rose",
  },
  {
    title: "Pages started",
    value: "01",
    description: "Overview scaffolded",
    icon: PanelsTopLeft,
    tone: "amber",
  },
  {
    title: "Problem statement",
    value: "Pending",
    description: "Product flow stays flexible",
    icon: ClipboardList,
    tone: "slate",
  },
];

export const setupItems = [
  {
    title: "Application layout",
    description: "Shared navigation and responsive page structure.",
    status: "ready",
    statusLabel: "Ready",
    icon: PanelsTopLeft,
  },
  {
    title: "Reusable components",
    description: "Metric cards, panels and status badges.",
    status: "ready",
    statusLabel: "Ready",
    icon: Blocks,
  },
  {
    title: "Problem-specific screens",
    description: "Define these after the official brief is released.",
    status: "waiting",
    statusLabel: "Waiting",
    icon: ClipboardList,
  },
  {
    title: "API and data integration",
    description: "Connect real data after the workflow is defined.",
    status: "later",
    statusLabel: "Later",
    icon: Database,
  },
];